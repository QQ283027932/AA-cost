import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// 初始化数据库
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('aayixia.db');

    // 创建表（分开执行避免事务问题）
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT
      );

      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        name TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        left_at TEXT,
        advance_payment INTEGER DEFAULT 0,
        default_coefficient REAL DEFAULT 1.0,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        activity_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        expense_date TEXT NOT NULL,
        payer_id TEXT,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY (payer_id) REFERENCES participants(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS expense_participants (
        id TEXT PRIMARY KEY,
        expense_id TEXT NOT NULL,
        participant_id TEXT NOT NULL,
        coefficient REAL DEFAULT 1.0,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_participants_activity ON participants(activity_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_activity ON expenses(activity_id);
      CREATE INDEX IF NOT EXISTS idx_expense_participants_expense ON expense_participants(expense_id);
      CREATE INDEX IF NOT EXISTS idx_expense_participants_participant ON expense_participants(participant_id);
    `);

    console.log('Database tables created successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    db = null;
    throw error;
  }
}

// 获取数据库实例
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// 生成UUID
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== 活动相关操作 ====================

export interface Activity {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  totalAmount?: number;
  participantsCount?: number;
}

export interface ActivityDetail extends Activity {
  currentParticipantsCount?: number;
}

export async function getAllActivities(): Promise<Activity[]> {
  const database = getDatabase();

  const activities = await database.getAllAsync<Activity>(
    'SELECT * FROM activities ORDER BY start_date DESC'
  );

  // 获取每个活动的统计数据
  const result: Activity[] = [];
  for (const activity of activities) {
    // 获取总花费
    const expenseResult = await database.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE activity_id = ?',
      [activity.id]
    );
    const totalAmount = expenseResult?.total || 0;

    // 获取当前参与者数量（未离开的）
    const countResult = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM participants WHERE activity_id = ? AND left_at IS NULL',
      [activity.id]
    );
    const participantsCount = countResult?.count || 0;

    result.push({
      ...activity,
      totalAmount,
      participantsCount,
    });
  }

  return result;
}

export async function getActivityById(id: string): Promise<ActivityDetail | null> {
  const database = getDatabase();

  const activity = await database.getFirstAsync<Activity>(
    'SELECT * FROM activities WHERE id = ?',
    [id]
  );

  if (!activity) return null;

  // 获取总花费
  const expenseResult = await database.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE activity_id = ?',
    [id]
  );
  const totalAmount = expenseResult?.total || 0;

  // 获取当前参与者数量
  const countResult = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM participants WHERE activity_id = ? AND left_at IS NULL',
    [id]
  );
  const currentParticipantsCount = countResult?.count || 0;

  return {
    ...activity,
    totalAmount,
    currentParticipantsCount,
  };
}

export async function createActivity(title: string): Promise<Activity> {
  const database = getDatabase();
  const id = generateId();
  const startDate = new Date().toISOString();

  await database.runAsync(
    'INSERT INTO activities (id, title, start_date) VALUES (?, ?, ?)',
    [id, title, startDate]
  );

  return {
    id,
    title,
    start_date: startDate,
    end_date: null,
  };
}

export async function deleteActivity(id: string): Promise<void> {
  const database = getDatabase();

  // 先删除费用分摊关系
  await database.runAsync(
    `DELETE FROM expense_participants WHERE expense_id IN (
      SELECT id FROM expenses WHERE activity_id = ?
    )`,
    [id]
  );

  // 删除费用记录
  await database.runAsync('DELETE FROM expenses WHERE activity_id = ?', [id]);

  // 删除参与者
  await database.runAsync('DELETE FROM participants WHERE activity_id = ?', [id]);

  // 删除活动
  await database.runAsync('DELETE FROM activities WHERE id = ?', [id]);
}

// ==================== 参与者相关操作 ====================

export interface Participant {
  id: string;
  activity_id: string;
  name: string;
  joined_at: string;
  left_at: string | null;
  advance_payment: number;
  default_coefficient: number;
  // 计算字段
  shareTotal?: number;
  paidTotal?: number;
  payableAmount?: number;
  balance?: number;
}

export async function getParticipantsByActivity(activityId: string): Promise<Participant[]> {
  const database = getDatabase();

  const participants = await database.getAllAsync<Participant>(
    'SELECT * FROM participants WHERE activity_id = ? ORDER BY joined_at ASC',
    [activityId]
  );

  // 获取费用记录
  const expenses = await database.getAllAsync<{ id: string; amount: number }>(
    'SELECT id, amount FROM expenses WHERE activity_id = ?',
    [activityId]
  );

  // 获取费用分摊关系
  const expenseParticipants = await database.getAllAsync<{
    expense_id: string;
    participant_id: string;
    coefficient: number;
  }>(
    'SELECT expense_id, participant_id, coefficient FROM expense_participants WHERE expense_id IN (SELECT id FROM expenses WHERE activity_id = ?)',
    [activityId]
  );

  // 计算每个参与者的费用信息
  return participants.map(participant => {
    // 获取该参与者参与的费用的分摊关系
    const participantExpenseRelations = expenseParticipants.filter(
      ep => ep.participant_id === participant.id
    );
    const participantExpenseIds = participantExpenseRelations.map(ep => ep.expense_id);

    // 获取这些费用的详细信息
    const participantExpenses = expenses.filter(e => participantExpenseIds.includes(e.id));

    // 计算分摊总额（按系数分摊）
    const shareTotal = participantExpenses.reduce((sum, e) => {
      // 获取这笔费用的所有参与者及其系数
      const expenseParticipantsWithCoeff = expenseParticipants.filter(ep => ep.expense_id === e.id);

      // 计算总系数
      const totalCoefficient = expenseParticipantsWithCoeff.reduce(
        (total, ep) => total + (ep.coefficient || 1.0),
        0
      );

      // 获取当前参与者的系数
      const myCoeff = expenseParticipantsWithCoeff.find(
        ep => ep.participant_id === participant.id
      )?.coefficient || 1.0;

      // 按系数计算分摊金额
      if (totalCoefficient === 0) {
        return sum + Math.floor(e.amount / expenseParticipantsWithCoeff.length);
      }
      return sum + Math.floor(e.amount * myCoeff / totalCoefficient);
    }, 0);

    // 计算支付总额
    const paidTotal = expenses
      .filter(e => {
        // 检查这笔费用的支付人是否是当前参与者
        const expense = expenses.find(exp => exp.id === e.id);
        return expense && participantExpenseIds.includes(expense.id);
      })
      .reduce((sum, e) => sum + e.amount, 0);

    // 获取该参与者作为支付人的费用总额
    const paidAsPayer = expenses
      .filter(e => {
        // 需要检查 payer_id
        return false; // 先简化，后面再处理
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      ...participant,
      shareTotal,
      paidTotal: 0, // 简化计算
      payableAmount: shareTotal - participant.advance_payment,
      balance: shareTotal - participant.advance_payment,
    };
  });
}

export async function createParticipant(
  activityId: string,
  name: string
): Promise<Participant> {
  const database = getDatabase();
  const id = generateId();
  const joinedAt = new Date().toISOString();

  await database.runAsync(
    'INSERT INTO participants (id, activity_id, name, joined_at, advance_payment, default_coefficient) VALUES (?, ?, ?, ?, 0, 1.0)',
    [id, activityId, name, joinedAt]
  );

  return {
    id,
    activity_id: activityId,
    name,
    joined_at: joinedAt,
    left_at: null,
    advance_payment: 0,
    default_coefficient: 1.0,
  };
}

export async function updateParticipant(
  activityId: string,
  participantId: string,
  data: {
    leftAt?: string | null;
    advancePayment?: number;
    defaultCoefficient?: number;
  }
): Promise<Participant | null> {
  const database = getDatabase();

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.leftAt !== undefined) {
    updates.push('left_at = ?');
    values.push(data.leftAt);
  }
  if (data.advancePayment !== undefined) {
    updates.push('advance_payment = ?');
    values.push(data.advancePayment);
  }
  if (data.defaultCoefficient !== undefined) {
    updates.push('default_coefficient = ?');
    values.push(data.defaultCoefficient);
  }

  if (updates.length === 0) return null;

  values.push(participantId, activityId);

  await database.runAsync(
    `UPDATE participants SET ${updates.join(', ')} WHERE id = ? AND activity_id = ?`,
    values
  );

  const participant = await database.getFirstAsync<Participant>(
    'SELECT * FROM participants WHERE id = ? AND activity_id = ?',
    [participantId, activityId]
  );

  return participant || null;
}

export async function deleteParticipant(
  activityId: string,
  participantId: string
): Promise<void> {
  const database = getDatabase();

  // 先删除该参与者的费用分摊关系
  await database.runAsync(
    `DELETE FROM expense_participants WHERE participant_id = ?`,
    [participantId]
  );

  // 删除参与者
  await database.runAsync(
    'DELETE FROM participants WHERE id = ? AND activity_id = ?',
    [participantId, activityId]
  );
}

// ==================== 费用相关操作 ====================

export interface Expense {
  id: string;
  activity_id: string;
  amount: number;
  description: string;
  expense_date: string;
  payer_id: string | null;
  payer_name?: string | null;
}

export interface ExpenseParticipant {
  expense_id: string;
  participant_id: string;
  coefficient: number;
}

export async function getExpensesByActivity(activityId: string): Promise<Expense[]> {
  const database = getDatabase();

  const expenses = await database.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE activity_id = ? ORDER BY expense_date DESC',
    [activityId]
  );

  // 获取支付人名称
  const result: Expense[] = [];
  for (const expense of expenses) {
    let payerName: string | null = null;
    if (expense.payer_id) {
      const payer = await database.getFirstAsync<{ name: string }>(
        'SELECT name FROM participants WHERE id = ?',
        [expense.payer_id]
      );
      payerName = payer?.name || null;
    }
    result.push({
      ...expense,
      payer_name: payerName,
    });
  }

  return result;
}

export async function getExpenseParticipants(expenseId: string): Promise<ExpenseParticipant[]> {
  const database = getDatabase();

  return await database.getAllAsync<ExpenseParticipant>(
    'SELECT expense_id, participant_id, coefficient FROM expense_participants WHERE expense_id = ?',
    [expenseId]
  );
}

export async function createExpense(
  activityId: string,
  data: {
    amount: number;
    description: string;
    payerId: string | null;
    participants: Array<{ participantId: string; coefficient: number }>;
  }
): Promise<Expense> {
  const database = getDatabase();
  const id = generateId();
  const expenseDate = new Date().toISOString();

  await database.runAsync(
    'INSERT INTO expenses (id, activity_id, amount, description, expense_date, payer_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, activityId, data.amount, data.description, expenseDate, data.payerId]
  );

  // 添加费用分摊关系
  for (const p of data.participants) {
    const epId = generateId();
    await database.runAsync(
      'INSERT INTO expense_participants (id, expense_id, participant_id, coefficient) VALUES (?, ?, ?, ?)',
      [epId, id, p.participantId, p.coefficient]
    );

    // 更新参与者的默认系数
    await database.runAsync(
      'UPDATE participants SET default_coefficient = ? WHERE id = ?',
      [p.coefficient, p.participantId]
    );
  }

  return {
    id,
    activity_id: activityId,
    amount: data.amount,
    description: data.description,
    expense_date: expenseDate,
    payer_id: data.payerId,
  };
}

export async function deleteExpense(activityId: string, expenseId: string): Promise<void> {
  const database = getDatabase();

  // 先删除费用分摊关系
  await database.runAsync('DELETE FROM expense_participants WHERE expense_id = ?', [expenseId]);

  // 删除费用记录
  await database.runAsync(
    'DELETE FROM expenses WHERE id = ? AND activity_id = ?',
    [expenseId, activityId]
  );
}

// ==================== 活动详情 ====================

export interface ActivityDetailResponse {
  activity: ActivityDetail;
  expenses: Expense[];
  participants: Participant[];
  expenseParticipants: ExpenseParticipant[];
  totalAmount: number;
  currentParticipantsCount: number;
}

export async function getActivityDetail(activityId: string): Promise<ActivityDetailResponse | null> {
  const activity = await getActivityById(activityId);
  if (!activity) return null;

  const expenses = await getExpensesByActivity(activityId);
  const participants = await getParticipantsByActivity(activityId);

  // 获取所有费用分摊关系
  const allExpenseParticipants: ExpenseParticipant[] = [];
  for (const expense of expenses) {
    const eps = await getExpenseParticipants(expense.id);
    allExpenseParticipants.push(...eps);
  }

  // 重新计算参与者的余额
  const participantsWithBalance = participants.map(participant => {
    // 获取该参与者参与的费用的分摊关系
    const participantExpenseRelations = allExpenseParticipants.filter(
      ep => ep.participant_id === participant.id
    );
    const participantExpenseIds = participantExpenseRelations.map(ep => ep.expense_id);

    // 获取这些费用的详细信息
    const participantExpenses = expenses.filter(e => participantExpenseIds.includes(e.id));

    // 计算分摊总额（按系数分摊）
    const shareTotal = participantExpenses.reduce((sum, e) => {
      // 获取这笔费用的所有参与者及其系数
      const expenseParticipantsWithCoeff = allExpenseParticipants.filter(ep => ep.expense_id === e.id);

      // 计算总系数
      const totalCoefficient = expenseParticipantsWithCoeff.reduce(
        (total, ep) => total + (ep.coefficient || 1.0),
        0
      );

      // 获取当前参与者的系数
      const myCoeff = expenseParticipantsWithCoeff.find(
        ep => ep.participant_id === participant.id
      )?.coefficient || 1.0;

      // 按系数计算分摊金额
      if (totalCoefficient === 0) {
        return sum + Math.floor(e.amount / expenseParticipantsWithCoeff.length);
      }
      return sum + Math.floor(e.amount * myCoeff / totalCoefficient);
    }, 0);

    // 计算支付总额（该参与者作为支付人的费用）
    const paidTotal = expenses
      .filter(e => e.payer_id === participant.id)
      .reduce((sum, e) => sum + e.amount, 0);

    // 提前支付金额
    const advancePayment = participant.advance_payment || 0;

    // 应付金额
    const payableAmount = shareTotal - advancePayment;

    // 余额
    const balance = payableAmount - paidTotal;

    return {
      ...participant,
      shareTotal,
      paidTotal,
      advancePayment,
      payableAmount,
      balance,
    };
  });

  return {
    activity,
    expenses,
    participants: participantsWithBalance,
    expenseParticipants: allExpenseParticipants,
    totalAmount: activity.totalAmount || 0,
    currentParticipantsCount: activity.currentParticipantsCount || 0,
  };
}
