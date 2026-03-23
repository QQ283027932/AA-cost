import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase as SQLiteDBType } from 'expo-sqlite';

// ==================== 类型定义 ====================

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

export interface Participant {
  id: string;
  activity_id: string;
  name: string;
  joined_at: string;
  left_at: string | null;
  advance_payment: number;
  default_coefficient: number;
  shareTotal?: number;
  paidTotal?: number;
  payableAmount?: number;
  balance?: number;
}

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

export interface ActivityDetailResponse {
  activity: ActivityDetail;
  expenses: Expense[];
  participants: Participant[];
  expenseParticipants: ExpenseParticipant[];
  totalAmount: number;
  currentParticipantsCount: number;
}

// ==================== 工具函数 ====================

export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== 内存存储实现（Web端）====================

class MemoryDatabase {
  private activities: Map<string, Activity> = new Map();
  private participants: Map<string, Participant> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private expenseParticipants: Map<string, ExpenseParticipant> = new Map();

  async init() {
    console.log('Memory database initialized');
  }

  // 活动操作
  async getAllActivities(): Promise<Activity[]> {
    const activities = Array.from(this.activities.values()).sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    return activities.map(activity => ({
      ...activity,
      totalAmount: this.getActivityTotalAmount(activity.id),
      participantsCount: this.getActivityParticipantsCount(activity.id),
    }));
  }

  private getActivityTotalAmount(activityId: string): number {
    let total = 0;
    this.expenses.forEach(e => {
      if (e.activity_id === activityId) {
        total += e.amount;
      }
    });
    return total;
  }

  private getActivityParticipantsCount(activityId: string): number {
    let count = 0;
    this.participants.forEach(p => {
      if (p.activity_id === activityId && !p.left_at) {
        count++;
      }
    });
    return count;
  }

  async getActivityById(id: string): Promise<ActivityDetail | null> {
    const activity = this.activities.get(id);
    if (!activity) return null;

    return {
      ...activity,
      totalAmount: this.getActivityTotalAmount(id),
      currentParticipantsCount: this.getActivityParticipantsCount(id),
    };
  }

  async createActivity(title: string): Promise<Activity> {
    const id = generateId();
    const activity: Activity = {
      id,
      title,
      start_date: new Date().toISOString(),
      end_date: null,
    };
    this.activities.set(id, activity);
    return activity;
  }

  async deleteActivity(id: string): Promise<void> {
    // 删除相关费用分摊关系
    const epIds: string[] = [];
    this.expenseParticipants.forEach((ep, key) => {
      const expense = this.expenses.get(ep.expense_id);
      if (expense && expense.activity_id === id) {
        epIds.push(key);
      }
    });
    epIds.forEach(key => this.expenseParticipants.delete(key));

    // 删除相关费用
    const expenseIds: string[] = [];
    this.expenses.forEach((e, key) => {
      if (e.activity_id === id) {
        expenseIds.push(key);
      }
    });
    expenseIds.forEach(key => this.expenses.delete(key));

    // 删除相关参与者
    const participantIds: string[] = [];
    this.participants.forEach((p, key) => {
      if (p.activity_id === id) {
        participantIds.push(key);
      }
    });
    participantIds.forEach(key => this.participants.delete(key));

    // 删除活动
    this.activities.delete(id);
  }

  // 参与者操作
  async getParticipantsByActivity(activityId: string): Promise<Participant[]> {
    const participants: Participant[] = [];
    this.participants.forEach(p => {
      if (p.activity_id === activityId) {
        participants.push(p);
      }
    });
    return participants.sort((a, b) => 
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    );
  }

  async createParticipant(activityId: string, name: string): Promise<Participant> {
    const id = generateId();
    const participant: Participant = {
      id,
      activity_id: activityId,
      name,
      joined_at: new Date().toISOString(),
      left_at: null,
      advance_payment: 0,
      default_coefficient: 1.0,
    };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipant(
    activityId: string,
    participantId: string,
    data: { leftAt?: string | null; advancePayment?: number; defaultCoefficient?: number }
  ): Promise<Participant | null> {
    const participant = this.participants.get(participantId);
    if (!participant || participant.activity_id !== activityId) return null;

    if (data.leftAt !== undefined) {
      participant.left_at = data.leftAt;
    }
    if (data.advancePayment !== undefined) {
      participant.advance_payment = data.advancePayment;
    }
    if (data.defaultCoefficient !== undefined) {
      participant.default_coefficient = data.defaultCoefficient;
    }

    this.participants.set(participantId, participant);
    return participant;
  }

  async deleteParticipant(activityId: string, participantId: string): Promise<void> {
    // 删除相关费用分摊关系
    const epIds: string[] = [];
    this.expenseParticipants.forEach((ep, key) => {
      if (ep.participant_id === participantId) {
        epIds.push(key);
      }
    });
    epIds.forEach(key => this.expenseParticipants.delete(key));

    // 删除参与者
    this.participants.delete(participantId);
  }

  // 费用操作
  async getExpensesByActivity(activityId: string): Promise<Expense[]> {
    const expenses: Expense[] = [];
    this.expenses.forEach(e => {
      if (e.activity_id === activityId) {
        // 添加支付人名称
        const payer = e.payer_id ? this.participants.get(e.payer_id) : null;
        expenses.push({
          ...e,
          payer_name: payer?.name || null,
        });
      }
    });
    return expenses.sort((a, b) => 
      new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );
  }

  async getExpenseParticipants(expenseId: string): Promise<ExpenseParticipant[]> {
    const eps: ExpenseParticipant[] = [];
    this.expenseParticipants.forEach(ep => {
      if (ep.expense_id === expenseId) {
        eps.push(ep);
      }
    });
    return eps;
  }

  async createExpense(
    activityId: string,
    data: {
      amount: number;
      description: string;
      payerId: string | null;
      participants: Array<{ participantId: string; coefficient: number }>;
    }
  ): Promise<Expense> {
    const id = generateId();
    const expense: Expense = {
      id,
      activity_id: activityId,
      amount: data.amount,
      description: data.description,
      expense_date: new Date().toISOString(),
      payer_id: data.payerId,
    };
    this.expenses.set(id, expense);

    // 添加费用分摊关系
    for (const p of data.participants) {
      const epId = generateId();
      this.expenseParticipants.set(epId, {
        expense_id: id,
        participant_id: p.participantId,
        coefficient: p.coefficient,
      });

      // 更新参与者的默认系数
      const participant = this.participants.get(p.participantId);
      if (participant) {
        participant.default_coefficient = p.coefficient;
        this.participants.set(p.participantId, participant);
      }
    }

    return expense;
  }

  async deleteExpense(activityId: string, expenseId: string): Promise<void> {
    // 删除相关费用分摊关系
    const epIds: string[] = [];
    this.expenseParticipants.forEach((ep, key) => {
      if (ep.expense_id === expenseId) {
        epIds.push(key);
      }
    });
    epIds.forEach(key => this.expenseParticipants.delete(key));

    // 删除费用
    this.expenses.delete(expenseId);
  }

  // 活动详情
  async getActivityDetail(activityId: string): Promise<ActivityDetailResponse | null> {
    const activity = await this.getActivityById(activityId);
    if (!activity) return null;

    const expenses = await this.getExpensesByActivity(activityId);
    const participants = await this.getParticipantsByActivity(activityId);

    // 获取所有费用分摊关系
    const allExpenseParticipants: ExpenseParticipant[] = [];
    for (const expense of expenses) {
      const eps = await this.getExpenseParticipants(expense.id);
      allExpenseParticipants.push(...eps);
    }

    // 计算参与者的余额
    const participantsWithBalance = participants.map(participant => {
      const participantExpenseRelations = allExpenseParticipants.filter(
        ep => ep.participant_id === participant.id
      );
      const participantExpenseIds = participantExpenseRelations.map(ep => ep.expense_id);
      const participantExpenses = expenses.filter(e => participantExpenseIds.includes(e.id));

      const shareTotal = participantExpenses.reduce((sum, e) => {
        const expenseParticipantsWithCoeff = allExpenseParticipants.filter(ep => ep.expense_id === e.id);
        const totalCoefficient = expenseParticipantsWithCoeff.reduce(
          (total, ep) => total + (ep.coefficient || 1.0),
          0
        );
        const myCoeff = expenseParticipantsWithCoeff.find(
          ep => ep.participant_id === participant.id
        )?.coefficient || 1.0;

        if (totalCoefficient === 0) {
          return sum + Math.floor(e.amount / expenseParticipantsWithCoeff.length);
        }
        return sum + Math.floor(e.amount * myCoeff / totalCoefficient);
      }, 0);

      const paidTotal = expenses
        .filter(e => e.payer_id === participant.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const advancePayment = participant.advance_payment || 0;
      const payableAmount = shareTotal - advancePayment;
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
}

// ==================== SQLite 存储实现（移动端）====================

let sqliteDb: SQLiteDBType | null = null;

async function initSQLite() {
  sqliteDb = await SQLite.openDatabaseAsync('aayixia.db');

  await sqliteDb!.execAsync(`
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

  console.log('SQLite database initialized');
}

// SQLite 实现类
class SQLiteDatabase {
  async init(): Promise<void> {
    // SQLite 初始化在 initSQLite 函数中完成
  }

  async getAllActivities(): Promise<Activity[]> {
    const activities = await await sqliteDb!.getAllAsync<Activity>(
      'SELECT * FROM activities ORDER BY start_date DESC'
    );

    const result: Activity[] = [];
    for (const activity of activities) {
      const expenseResult = await sqliteDb!.getFirstAsync<{ total: number }>(
        'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE activity_id = ?',
        [activity.id]
      );
      const totalAmount = expenseResult?.total || 0;

      const countResult = await sqliteDb!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM participants WHERE activity_id = ? AND left_at IS NULL',
        [activity.id]
      );
      const participantsCount = countResult?.count || 0;

      result.push({ ...activity, totalAmount, participantsCount });
    }
    return result;
  }

  async getActivityById(id: string): Promise<ActivityDetail | null> {
    const activity = await sqliteDb!.getFirstAsync<Activity>(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );
    if (!activity) return null;

    const expenseResult = await sqliteDb!.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE activity_id = ?',
      [id]
    );
    const totalAmount = expenseResult?.total || 0;

    const countResult = await sqliteDb!.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM participants WHERE activity_id = ? AND left_at IS NULL',
      [id]
    );
    const currentParticipantsCount = countResult?.count || 0;

    return { ...activity, totalAmount, currentParticipantsCount };
  }

  async createActivity(title: string): Promise<Activity> {
    const id = generateId();
    const startDate = new Date().toISOString();
    await sqliteDb!.runAsync(
      'INSERT INTO activities (id, title, start_date) VALUES (?, ?, ?)',
      [id, title, startDate]
    );
    return { id, title, start_date: startDate, end_date: null };
  }

  async deleteActivity(id: string): Promise<void> {
    await sqliteDb!.runAsync(
      `DELETE FROM expense_participants WHERE expense_id IN (SELECT id FROM expenses WHERE activity_id = ?)`,
      [id]
    );
    await sqliteDb!.runAsync('DELETE FROM expenses WHERE activity_id = ?', [id]);
    await sqliteDb!.runAsync('DELETE FROM participants WHERE activity_id = ?', [id]);
    await sqliteDb!.runAsync('DELETE FROM activities WHERE id = ?', [id]);
  }

  async getParticipantsByActivity(activityId: string): Promise<Participant[]> {
    return await sqliteDb!.getAllAsync<Participant>(
      'SELECT * FROM participants WHERE activity_id = ? ORDER BY joined_at ASC',
      [activityId]
    );
  }

  async createParticipant(activityId: string, name: string): Promise<Participant> {
    const id = generateId();
    const joinedAt = new Date().toISOString();
    await sqliteDb!.runAsync(
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

  async updateParticipant(
    activityId: string,
    participantId: string,
    data: { leftAt?: string | null; advancePayment?: number; defaultCoefficient?: number }
  ): Promise<Participant | null> {
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

    await sqliteDb!.runAsync(
      `UPDATE participants SET ${updates.join(', ')} WHERE id = ? AND activity_id = ?`,
      values
    );

    return await sqliteDb!.getFirstAsync<Participant>(
      'SELECT * FROM participants WHERE id = ? AND activity_id = ?',
      [participantId, activityId]
    );
  }

  async deleteParticipant(activityId: string, participantId: string): Promise<void> {
    await sqliteDb!.runAsync('DELETE FROM expense_participants WHERE participant_id = ?', [participantId]);
    await sqliteDb!.runAsync('DELETE FROM participants WHERE id = ? AND activity_id = ?', [participantId, activityId]);
  }

  async getExpensesByActivity(activityId: string): Promise<Expense[]> {
    const expenses = await sqliteDb!.getAllAsync<Expense>(
      'SELECT * FROM expenses WHERE activity_id = ? ORDER BY expense_date DESC',
      [activityId]
    );

    const result: Expense[] = [];
    for (const expense of expenses) {
      let payerName: string | null = null;
      if (expense.payer_id) {
        const payer = await sqliteDb!.getFirstAsync<{ name: string }>(
          'SELECT name FROM participants WHERE id = ?',
          [expense.payer_id]
        );
        payerName = payer?.name || null;
      }
      result.push({ ...expense, payer_name: payerName });
    }
    return result;
  }

  async getExpenseParticipants(expenseId: string): Promise<ExpenseParticipant[]> {
    return await sqliteDb!.getAllAsync<ExpenseParticipant>(
      'SELECT expense_id, participant_id, coefficient FROM expense_participants WHERE expense_id = ?',
      [expenseId]
    );
  }

  async createExpense(
    activityId: string,
    data: {
      amount: number;
      description: string;
      payerId: string | null;
      participants: Array<{ participantId: string; coefficient: number }>;
    }
  ): Promise<Expense> {
    const id = generateId();
    const expenseDate = new Date().toISOString();

    await sqliteDb!.runAsync(
      'INSERT INTO expenses (id, activity_id, amount, description, expense_date, payer_id) VALUES (?, ?, ?, ?, ?, ?)',
      [id, activityId, data.amount, data.description, expenseDate, data.payerId]
    );

    for (const p of data.participants) {
      const epId = generateId();
      await sqliteDb!.runAsync(
        'INSERT INTO expense_participants (id, expense_id, participant_id, coefficient) VALUES (?, ?, ?, ?)',
        [epId, id, p.participantId, p.coefficient]
      );
      await sqliteDb!.runAsync(
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

  async deleteExpense(activityId: string, expenseId: string): Promise<void> {
    await sqliteDb!.runAsync('DELETE FROM expense_participants WHERE expense_id = ?', [expenseId]);
    await sqliteDb!.runAsync('DELETE FROM expenses WHERE id = ? AND activity_id = ?', [expenseId, activityId]);
  }

  async getActivityDetail(activityId: string): Promise<ActivityDetailResponse | null> {
    const activity = await this.getActivityById(activityId);
    if (!activity) return null;

    const expenses = await this.getExpensesByActivity(activityId);
    const participants = await this.getParticipantsByActivity(activityId);

    const allExpenseParticipants: ExpenseParticipant[] = [];
    for (const expense of expenses) {
      const eps = await this.getExpenseParticipants(expense.id);
      allExpenseParticipants.push(...eps);
    }

    const participantsWithBalance = participants.map(participant => {
      const participantExpenseRelations = allExpenseParticipants.filter(
        ep => ep.participant_id === participant.id
      );
      const participantExpenseIds = participantExpenseRelations.map(ep => ep.expense_id);
      const participantExpenses = expenses.filter(e => participantExpenseIds.includes(e.id));

      const shareTotal = participantExpenses.reduce((sum, e) => {
        const expenseParticipantsWithCoeff = allExpenseParticipants.filter(ep => ep.expense_id === e.id);
        const totalCoefficient = expenseParticipantsWithCoeff.reduce(
          (total, ep) => total + (ep.coefficient || 1.0),
          0
        );
        const myCoeff = expenseParticipantsWithCoeff.find(
          ep => ep.participant_id === participant.id
        )?.coefficient || 1.0;

        if (totalCoefficient === 0) {
          return sum + Math.floor(e.amount / expenseParticipantsWithCoeff.length);
        }
        return sum + Math.floor(e.amount * myCoeff / totalCoefficient);
      }, 0);

      const paidTotal = expenses
        .filter(e => e.payer_id === participant.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const advancePayment = participant.advance_payment || 0;
      const payableAmount = shareTotal - advancePayment;
      const balance = payableAmount - paidTotal;

      return { ...participant, shareTotal, paidTotal, advancePayment, payableAmount, balance };
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
}

// ==================== 统一导出 ====================

let dbInstance: MemoryDatabase | SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

export async function initDatabase(): Promise<void> {
  // 如果已经初始化过，直接返回
  if (dbInstance) return;
  
  // 如果正在初始化，等待完成
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      if (Platform.OS === 'web') {
        dbInstance = new MemoryDatabase();
        await dbInstance.init();
        console.log('Memory database initialized');
      } else {
        await initSQLite();
        dbInstance = new SQLiteDatabase();
        console.log('SQLite database initialized');
      }
    } catch (error) {
      initError = error instanceof Error ? error : new Error(String(error));
      console.error('Database initialization failed:', initError);
      throw initError;
    }
  })();
  
  return initPromise;
}

export function isDatabaseReady(): boolean {
  return dbInstance !== null;
}

export function getInitError(): Error | null {
  return initError;
}

export function getAllActivities(): Promise<Activity[]> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.getAllActivities();
}

export function getActivityById(id: string): Promise<ActivityDetail | null> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.getActivityById(id);
}

export function createActivity(title: string): Promise<Activity> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.createActivity(title);
}

export function deleteActivity(id: string): Promise<void> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.deleteActivity(id);
}

export function getParticipantsByActivity(activityId: string): Promise<Participant[]> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.getParticipantsByActivity(activityId);
}

export function createParticipant(activityId: string, name: string): Promise<Participant> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.createParticipant(activityId, name);
}

export function updateParticipant(
  activityId: string,
  participantId: string,
  data: { leftAt?: string | null; advancePayment?: number; defaultCoefficient?: number }
): Promise<Participant | null> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.updateParticipant(activityId, participantId, data);
}

export function deleteParticipant(activityId: string, participantId: string): Promise<void> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.deleteParticipant(activityId, participantId);
}

export function getExpensesByActivity(activityId: string): Promise<Expense[]> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.getExpensesByActivity(activityId);
}

export function getExpenseParticipants(expenseId: string): Promise<ExpenseParticipant[]> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.getExpenseParticipants(expenseId);
}

export function createExpense(
  activityId: string,
  data: {
    amount: number;
    description: string;
    payerId: string | null;
    participants: Array<{ participantId: string; coefficient: number }>;
  }
): Promise<Expense> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.createExpense(activityId, data);
}

export function deleteExpense(activityId: string, expenseId: string): Promise<void> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.deleteExpense(activityId, expenseId);
}

export function getActivityDetail(activityId: string): Promise<ActivityDetailResponse | null> {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance.getActivityDetail(activityId);
}
