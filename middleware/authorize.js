export const authorizeModification = (req, res, next) => {
    const { role, id } = req.user;
    const { userId } = req.params;

    if (role === "parent") {
        return next();
    }

    if (role === "child" && String(userId) === String(id)) {
        return next();
    }

    return res.status(403).json({
        error: "Access denied"
    })
    
}
