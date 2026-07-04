const chatService = require("../services/chat.service");

const getHistory = async (req, res) => {
  try {
    const history = await chatService.getHistory(
      req.params.sessionId,
      req.user.id,
    );

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const queryChat = async (req, res) => {
  try {
    const result = await chatService.queryChat({
      ...req.body,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Chat processed successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getHistory,
  queryChat,
};
