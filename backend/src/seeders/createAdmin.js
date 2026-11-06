import { sequelize } from '../config/database.js';
import '../models/index.js';
import { User } from '../models/index.js';
import { seedDefaultData } from './seed.js';

const email = process.env.ADMIN_EMAIL || 'admin@gmail.com';
const password = process.env.ADMIN_PASS || 'Asdf1234';
const name = process.env.ADMIN_NAME || 'Admin';

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedDefaultData();
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      existing.passwordHash = await User.hashPassword(password);
      existing.name = name;
      await existing.save();
      console.log(`✅ Admin updated: ${email}`);
    } else {
      await User.create({ name, email, passwordHash: await User.hashPassword(password), role: 'admin' });
      console.log(`✅ Admin created: ${email} / ${password}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};
run();
