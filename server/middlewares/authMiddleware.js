import { clerkClient } from "@clerk/express";

export const protectEducator = async (req, res, next) => {
  try {
    const auth = req.auth();

    if (!auth || !auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await clerkClient.users.getUser(auth.userId);

    if (user.publicMetadata.role !== "educator") {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
