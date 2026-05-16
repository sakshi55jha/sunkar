import prisma from "../prisma";
export async function syncUserHandler(req, res) {
    try {
        const { id, email, name, imageUrl, role } = req.body;
        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const user = await prisma.user.upsert({
            where: { id: String(id) },
            update: {
                email: email || undefined,
                name: name || undefined,
                imageUrl: imageUrl || undefined,
                role: role || undefined,
            },
            create: {
                id: String(id),
                email: email || null,
                name: name || null,
                imageUrl: imageUrl || null,
                role: role || null,
            },
        });
        return res.json({ success: true, user });
    }
    catch (err) {
        console.error("❌ Error syncing user:", err);
        return res.status(500).json({ error: "Failed to sync user" });
    }
}
//# sourceMappingURL=userController.js.map