import { Router } from 'express';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const router = Router();

// GET /api/v1/activities - 获取所有活动列表
router.get('/', async (req, res) => {
  try {
    const client = getSupabaseClient();

    const { data: activities, error } = await client
      .from('activities')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    // 获取每个活动的总花费金额和参与者数量
    const activityIds = activities?.map((a: any) => a.id) || [];

    // 获取费用记录
    const { data: expenses } = await client
      .from('expenses')
      .select('activity_id, amount')
      .in('activity_id', activityIds);

    // 获取参与者数量（只计算未离开的）
    const { data: participants } = await client
      .from('participants')
      .select('activity_id')
      .in('activity_id', activityIds)
      .is('left_at', null);

    // 计算每个活动的统计数据
    const activityStats = activities?.map((activity: any) => {
      const activityExpenses = expenses?.filter((e: any) => e.activity_id === activity.id) || [];
      const totalAmount = activityExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const participantsCount = participants?.filter((p: any) => p.activity_id === activity.id).length || 0;

      return {
        ...activity,
        totalAmount,
        participantsCount,
      };
    }) || [];

    res.json({ activities: activityStats });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/activities/:id - 获取活动详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();

    // 获取活动信息
    const { data: activity, error: activityError } = await client
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (activityError || !activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // 获取费用记录
    const { data: expenses, error: expensesError } = await client
      .from('expenses')
      .select('*')
      .eq('activity_id', id)
      .order('expense_date', { ascending: false });

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }

    // 获取参与者列表
    const { data: participants, error: participantsError } = await client
      .from('participants')
      .select('*')
      .eq('activity_id', id)
      .order('joined_at', { ascending: true });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return res.status(500).json({ error: 'Failed to fetch participants' });
    }

    // 获取费用分摊关系
    const expenseIds = expenses?.map((e: any) => e.id) || [];
    const { data: expenseParticipants } = await client
      .from('expense_participants')
      .select('*')
      .in('expense_id', expenseIds);

    // 计算总花费金额
    const totalAmount = expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;

    // 计算当前参与人数（未离开的）
    const currentParticipants = participants?.filter((p: any) => !p.left_at) || [];
    const currentParticipantsCount = currentParticipants.length;

    // 计算每个参与者的费用信息
    const participantsWithBalance = participants?.map((participant: any) => {
      // 获取该参与者参与的费用的分摊关系
      const participantExpenseRelations = expenseParticipants?.filter((ep: any) => ep.participant_id === participant.id) || [];
      const participantExpenseIds = participantExpenseRelations.map((ep: any) => ep.expense_id);

      // 获取这些费用的详细信息
      const participantExpenses = expenses?.filter((e: any) => participantExpenseIds.includes(e.id)) || [];

      // 计算分摊总额（按系数分摊）
      const shareTotal = participantExpenses.reduce((sum: number, e: any) => {
        // 获取这笔费用的所有参与者及其系数
        const expenseParticipantsWithCoeff = expenseParticipants?.filter((ep: any) => ep.expense_id === e.id) || [];

        // 计算总系数
        const totalCoefficient = expenseParticipantsWithCoeff.reduce((total: number, ep: any) => total + (ep.coefficient || 1.0), 0);

        // 获取当前参与者的系数
        const myCoeff = expenseParticipantsWithCoeff.find((ep: any) => ep.participant_id === participant.id)?.coefficient || 1.0;

        // 按系数计算分摊金额：总金额 * (个人系数 / 总系数)
        if (totalCoefficient === 0) {
          return sum + Math.floor(e.amount / expenseParticipantsWithCoeff.length);
        }
        return sum + Math.floor(e.amount * myCoeff / totalCoefficient);
      }, 0);

      // 计算支付总额（该参与者作为支付人的费用）
      const paidTotal = expenses?.filter((e: any) => e.payer_id === participant.id).reduce((sum: number, e: any) => sum + e.amount, 0) || 0;

      // 提前支付金额
      const advancePayment = participant.advance_payment || 0;

      // 应付金额（分摊总额 - 提前支付金额）
      const payableAmount = shareTotal - advancePayment;

      // 需支付/退费金额（应付金额 - 已付金额）
      const balance = payableAmount - paidTotal;

      return {
        ...participant,
        shareTotal,
        paidTotal,
        advancePayment,
        payableAmount,
        balance,
      };
    }) || [];

    res.json({
      activity,
      expenses: expenses || [],
      participants: participantsWithBalance,
      totalAmount,
      currentParticipantsCount,
      expenseParticipants: expenseParticipants || [],
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/activities - 创建新活动
router.post('/', async (req, res) => {
  try {
    const { title, startDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('activities')
      .insert({
        title,
        start_date: startDate || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return res.status(500).json({ error: 'Failed to create activity' });
    }

    res.status(201).json({ activity: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/activities/:id/expenses - 添加费用记录
router.post('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, expenseDate, payerId, participantIds, participants } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
    }
    if (!payerId) {
      return res.status(400).json({ error: 'PayerId is required' });
    }

    // 支持两种格式：旧格式 participantIds 数组，新格式 participants 数组（带系数）
    let expenseParticipants: Array<{ participantId: string; coefficient: number }> = [];

    if (participants && Array.isArray(participants)) {
      // 新格式：participants 数组，每个元素包含 participantId 和 coefficient
      expenseParticipants = participants.map((p: any) => ({
        participantId: p.participantId || p.id,
        coefficient: p.coefficient || 1.0,
      }));
    } else if (participantIds && participantIds.length > 0) {
      // 旧格式：participantIds 数组，默认系数为 1.0
      expenseParticipants = participantIds.map((participantId: string) => ({
        participantId,
        coefficient: 1.0,
      }));
    } else {
      return res.status(400).json({ error: 'Participants or participantIds is required' });
    }

    if (expenseParticipants.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    const client = getSupabaseClient();

    // 检查活动是否存在
    const { data: activity, error: activityError } = await client
      .from('activities')
      .select('id')
      .eq('id', id)
      .single();

    if (activityError || !activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // 添加费用记录
    const { data: expense, error: expenseError } = await client
      .from('expenses')
      .insert({
        activity_id: id,
        payer_id: payerId,
        amount: parseInt(amount),
        description: description || '',
        expense_date: expenseDate || new Date().toISOString(),
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error adding expense:', expenseError);
      return res.status(500).json({ error: 'Failed to add expense' });
    }

    // 添加费用分摊关系（带系数）
    const participantRelations = expenseParticipants.map((p) => ({
      expense_id: expense.id,
      participant_id: p.participantId,
      coefficient: p.coefficient,
    }));

    const { error: relationError } = await client
      .from('expense_participants')
      .insert(participantRelations);

    if (relationError) {
      console.error('Error adding expense participants:', relationError);
      // 回滚费用记录
      await client.from('expenses').delete().eq('id', expense.id);
      return res.status(500).json({ error: 'Failed to add expense participants' });
    }

    // 更新参与者的默认系数（保存本次使用的系数，下次添加费用时自动继承）
    for (const p of expenseParticipants) {
      await client
        .from('participants')
        .update({ default_coefficient: p.coefficient })
        .eq('id', p.participantId);
    }

    res.status(201).json({ expense });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/activities/:id/expenses/:expenseId - 删除费用记录
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const client = getSupabaseClient();

    // 先删除费用分摊关系
    await client
      .from('expense_participants')
      .delete()
      .eq('expense_id', expenseId);

    // 删除费用记录
    const { error } = await client
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('activity_id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/activities/:id/participants - 添加参与者
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, joinedAt, advancePayment, defaultCoefficient } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const client = getSupabaseClient();

    // 检查活动是否存在
    const { data: activity, error: activityError } = await client
      .from('activities')
      .select('id')
      .eq('id', id)
      .single();

    if (activityError || !activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // 添加参与者
    const { data, error } = await client
      .from('participants')
      .insert({
        activity_id: id,
        name,
        joined_at: joinedAt || new Date().toISOString(),
        advance_payment: advancePayment || 0,
        default_coefficient: defaultCoefficient || 1.0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding participant:', error);
      return res.status(500).json({ error: 'Failed to add participant' });
    }

    res.status(201).json({ participant: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/v1/activities/:id/participants/:participantId - 更新参与者
router.patch('/:id/participants/:participantId', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const { leftAt, advancePayment, defaultCoefficient } = req.body;

    const client = getSupabaseClient();

    const updateData: any = {};
    if (leftAt !== undefined) {
      updateData.left_at = leftAt;
    }
    if (advancePayment !== undefined) {
      updateData.advance_payment = parseInt(advancePayment);
    }
    if (defaultCoefficient !== undefined) {
      updateData.default_coefficient = parseFloat(defaultCoefficient);
    }

    const { data, error } = await client
      .from('participants')
      .update(updateData)
      .eq('id', participantId)
      .eq('activity_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating participant:', error);
      return res.status(500).json({ error: 'Failed to update participant' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ participant: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/activities/:id/participants/:participantId - 删除参与者
router.delete('/:id/participants/:participantId', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const client = getSupabaseClient();

    const { error } = await client
      .from('participants')
      .delete()
      .eq('id', participantId)
      .eq('activity_id', id);

    if (error) {
      console.error('Error deleting participant:', error);
      return res.status(500).json({ error: 'Failed to delete participant' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/activities/:id - 删除活动
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = getSupabaseClient();

    // 先删除所有费用分摊关系
    await client
      .from('expense_participants')
      .delete()
      .in('expense_id', (await client.from('expenses').select('id').eq('activity_id', id)).data?.map((e: any) => e.id) || []);

    // 删除所有费用记录
    await client
      .from('expenses')
      .delete()
      .eq('activity_id', id);

    // 删除所有参与者
    await client
      .from('participants')
      .delete()
      .eq('activity_id', id);

    // 删除活动
    const { error } = await client
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
      return res.status(500).json({ error: 'Failed to delete activity' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
