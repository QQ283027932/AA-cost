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

    // 计算总花费金额
    const totalAmount = expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0;

    // 计算当前参与人数（未离开的）
    const currentParticipants = participants?.filter((p: any) => !p.left_at) || [];
    const participantsCount = currentParticipants.length;

    // 计算每人应付金额
    const amountPerPerson = participantsCount > 0
      ? totalAmount / participantsCount
      : 0;

    res.json({
      activity,
      expenses: expenses || [],
      participants: participants || [],
      totalAmount,
      currentParticipantsCount: participantsCount,
      amountPerPerson: Number(amountPerPerson.toFixed(2)),
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
    const { amount, description, expenseDate } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be greater than 0' });
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
    const { data, error } = await client
      .from('expenses')
      .insert({
        activity_id: id,
        amount: parseInt(amount),
        description: description || '',
        expense_date: expenseDate || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding expense:', error);
      return res.status(500).json({ error: 'Failed to add expense' });
    }

    res.status(201).json({ expense: data });
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
    const { name, joinedAt } = req.body;

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

// PATCH /api/v1/activities/:id/participants/:participantId - 更新参与者状态（标记离开）
router.patch('/:id/participants/:participantId', async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const { leftAt } = req.body;

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('participants')
      .update({
        left_at: leftAt || new Date().toISOString(),
      })
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

    // 先删除所有费用记录
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
