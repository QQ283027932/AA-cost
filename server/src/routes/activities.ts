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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }

    // 获取每个活动的参与者数量
    const activityIds = activities?.map((a: any) => a.id) || [];
    const { data: participantsCount } = await client
      .from('participants')
      .select('activity_id')
      .in('activity_id', activityIds);

    // 计算每个活动的参与者数量
    const participantCounts = activities?.map((activity: any) => {
      const count = participantsCount?.filter((p: any) => p.activity_id === activity.id).length || 0;
      return {
        ...activity,
        participantsCount: count,
      };
    }) || [];

    res.json({ activities: participantCounts });
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

    // 获取参与者列表
    const { data: participants, error: participantsError } = await client
      .from('participants')
      .select('*')
      .eq('activity_id', id)
      .order('created_at', { ascending: true });

    if (participantsError) {
      console.error('Error fetching participants:', participantsError);
      return res.status(500).json({ error: 'Failed to fetch participants' });
    }

    // 计算每人应付金额
    const participantsCount = participants?.length || 0;
    const amountPerPerson = participantsCount > 0
      ? (activity as any).total_amount / participantsCount
      : 0;

    res.json({
      activity,
      participants: participants || [],
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
    const { title, totalAmount } = req.body;

    if (!title || !totalAmount) {
      return res.status(400).json({ error: 'Title and totalAmount are required' });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('activities')
      .insert({
        title,
        total_amount: parseInt(totalAmount),
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

// POST /api/v1/activities/:id/participants - 添加参与者
router.post('/:id/participants', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

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

    // 先删除所有参与者
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
