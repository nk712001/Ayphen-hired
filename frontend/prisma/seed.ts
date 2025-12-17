
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'superadmin@example.com'
    const password = 'superuser123'
    const role = 'SUPER_ADMIN'

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Upsert the user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            role: role,
            isActive: true,
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Super Admin',
            role: role,
            isActive: true,
        },
    })

    console.log({ user })
    console.log(`\n✅ Super Admin created!`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`\n👉 You can now log in at /auth/signin`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
