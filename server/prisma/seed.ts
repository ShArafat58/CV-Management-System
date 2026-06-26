import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const builtInAttributes = [
    { name: "First Name", category: "PERSONAL_INFORMATION", dataType: "STRING" },
    { name: "Last Name", category: "PERSONAL_INFORMATION", dataType: "STRING" },
    { name: "Location", category: "PERSONAL_INFORMATION", dataType: "STRING" },
    { name: "Personal Photo", category: "PERSONAL_INFORMATION", dataType: "IMAGE" },
] as const;

async function main() {
    for (const attr of builtInAttributes) {
        await prisma.attribute.upsert({
            where: { name: attr.name },
            update: { isBuiltIn: true },
            create: {
                name: attr.name,
                category: attr.category,
                dataType: attr.dataType,
                isBuiltIn: true,
            },
        });
    }
    console.log("Built-in attributes seeded");
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
    });