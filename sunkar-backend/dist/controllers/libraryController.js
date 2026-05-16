import prisma from '../prisma';
export const toggleLibraryHandler = async (req, res) => {
    try {
        const { userId, creatorStoryId } = req.body;
        if (!userId || !creatorStoryId) {
            res.status(400).json({ error: 'Missing userId or creatorStoryId' });
            return;
        }
        const existing = await prisma.savedStory.findUnique({
            where: {
                userId_creatorStoryId: {
                    userId,
                    creatorStoryId
                }
            }
        });
        if (existing) {
            await prisma.savedStory.delete({
                where: { id: existing.id }
            });
            res.json({ isSaved: false });
        }
        else {
            await prisma.savedStory.create({
                data: {
                    userId,
                    creatorStoryId
                }
            });
            res.json({ isSaved: true });
        }
    }
    catch (error) {
        console.error('Error toggling library:', error);
        res.status(500).json({ error: 'Failed to toggle library status' });
    }
};
export const getLibraryHandler = async (req, res) => {
    try {
        const userId = String(req.params.userId ?? "");
        if (!userId) {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }
        const savedStories = await prisma.savedStory.findMany({
            where: { userId },
            include: {
                creatorStory: {
                    include: {
                        user: {
                            select: { name: true, imageUrl: true }
                        }
                    }
                }
            },
            orderBy: { savedAt: 'desc' }
        });
        res.json(savedStories);
    }
    catch (error) {
        console.error('Error fetching library:', error);
        res.status(500).json({ error: 'Failed to fetch library' });
    }
};
//# sourceMappingURL=libraryController.js.map