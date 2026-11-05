const Notification = require('../models/Notification');

/**
 * @desc    Get all notifications for the logged-in customer
 * @route   GET /api/notifications
 * @access  Private/Customer
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ customer: req.user._id })
      .sort('-createdAt')
      .limit(100);

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread notification count for the logged-in customer
 * @route   GET /api/notifications/unread-count
 * @access  Private/Customer
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      customer: req.user._id,
      isRead: false
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private/Customer
 */
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, message: 'Notification marked as read', data: notification });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read for the logged-in customer
 * @route   PATCH /api/notifications/read-all
 * @access  Private/Customer
 */
const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { customer: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private/Customer
 */
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      customer: req.user._id
    });

    if (!notification) {
      res.status(404);
      return next(new Error('Notification not found'));
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
};
