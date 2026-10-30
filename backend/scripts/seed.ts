// scripts/seed.ts
import * as dotenv from 'dotenv';
dotenv.config();

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '../src/shared/auth/auth';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function seed() {
  console.log('🌱 Iniciando seed da loja Luana Rohr Art...');

  // 1. Permissões
  const permissionData = [
    { code: 'product:manage', description: 'Gerenciar produtos, variantes e imagens' },
    { code: 'order:manage', description: 'Gerenciar pedidos (status, pagamento, export)' },
    { code: 'order:view', description: 'Visualizar pedidos e relatórios de vendas' },
    { code: 'user:manage', description: 'Gerenciar usuários' },
    { code: 'role:manage', description: 'Gerenciar papéis e permissões' },
    { code: 'audit:view', description: 'Visualizar logs de auditoria' },
  ];

  console.log('📌 Inserindo permissões...');
  await db
    .insert(schema.permissions)
    .values(permissionData)
    .onConflictDoNothing({ target: schema.permissions.code });
  const insertedPermissions = await db.select().from(schema.permissions);

  // 2. Papéis
  const roleData = [
    { name: 'admin', description: 'Administrador da loja — acesso total' },
    { name: 'cliente', description: 'Cliente — compra e acompanha seus pedidos' },
  ];

  console.log('📌 Inserindo papéis...');
  await db
    .insert(schema.roles)
    .values(roleData)
    .onConflictDoNothing({ target: schema.roles.name });
  const insertedRoles = await db.select().from(schema.roles);

  const getPermissionId = (code: string) => insertedPermissions.find((p) => p.code === code)?.id;

  async function assignPermissions(roleName: string, permissionCodes: string[]) {
    const role = insertedRoles.find((r) => r.name === roleName);
    if (!role) return;
    const permissionIds = permissionCodes
      .map((code) => getPermissionId(code))
      .filter((id): id is number => id !== undefined);
    if (permissionIds.length === 0) return;
    const values = permissionIds.map((permissionId) => ({ roleId: role.id, permissionId }));
    await db.insert(schema.rolePermissions).values(values).onConflictDoNothing();
  }

  console.log('🔗 Associando permissões aos papéis...');
  await assignPermissions(
    'admin',
    permissionData.map((p) => p.code)
  );
  // Cliente não possui permissões administrativas.

  // 3. Admin padrão
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@luanarohr.art';
  const adminName = process.env.ADMIN_NAME || 'Luana Rohr';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  async function ensureAdminUser(email: string, name: string, password: string) {
    const [existingUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email));

    let userId = existingUser?.id;
    if (!userId) {
      const response = await auth.api.signUpEmail({
        body: { email, password, name },
        asResponse: false,
      });
      const newUser = (response as { user: { id: string } }).user;
      userId = newUser.id;
      console.log(`✅  Usuário ${email} criado.`);
    } else {
      await db.update(schema.user).set({ name }).where(eq(schema.user.id, userId));
      console.log(`ℹ️  Usuário ${email} já existe.`);
    }

    // Marca o usuário como admin (atalho usado por loadPermissions)
    await db.update(schema.user).set({ role: 'admin' }).where(eq(schema.user.id, userId));

    const adminRole = insertedRoles.find((r) => r.name === 'admin');
    if (!adminRole) throw new Error('Role admin não encontrada');
    const [existingRole] = await db
      .select()
      .from(schema.userRoles)
      .where(and(eq(schema.userRoles.userId, userId), eq(schema.userRoles.roleId, adminRole.id)));
    if (!existingRole) {
      await db.insert(schema.userRoles).values({ userId, roleId: adminRole.id });
      console.log(`✅  ${email} agora é admin.`);
    }
    return userId;
  }

  const adminId = await ensureAdminUser(adminEmail, adminName, adminPassword);

  // 4. Produtos de exemplo (camisetas)
  console.log('👕 Inserindo produtos de exemplo...');
  const sampleProducts = [
    {
      name: 'Camiseta Aquarela Botânica',
      basePrice: 89.9,
      description: 'Camiseta 100% algodão com estampa exclusiva em aquarela de flores do cerrado.',
      colors: ['Branca', 'Areia'],
      tags: ['aquarela', 'botânica'],
    },
    {
      name: 'Camiseta Traço Minimalista',
      basePrice: 79.9,
      description: 'Arte de linha única desenhada à mão. Toque macio e caimento leve.',
      colors: ['Preta', 'Branca'],
      tags: ['minimalista', 'line art'],
    },
    {
      name: 'Camiseta Retrato Abstrato',
      basePrice: 99.9,
      description: 'Estampa de retrato abstrato em tons terrosos. Edição limitada.',
      colors: ['Terracota', 'Off-white'],
      tags: ['abstrato', 'edição limitada'],
    },
  ];

  const sizes = ['P', 'M', 'G', 'GG'];

  for (const p of sampleProducts) {
    const slug = slugify(p.name);
    const [existing] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.slug, slug));
    if (existing) {
      console.log(`ℹ️  Produto "${p.name}" já existe.`);
      continue;
    }

    const [product] = await db
      .insert(schema.products)
      .values({
        name: p.name,
        slug,
        description: p.description,
        basePrice: p.basePrice,
        active: true,
        tags: p.tags,
        createdBy: adminId,
      })
      .returning();

    // Variantes: cada tamanho × cor
    const variants = [];
    for (const color of p.colors) {
      for (const size of sizes) {
        variants.push({
          productId: product.id,
          size,
          color,
          sku: `${slug}-${slugify(color)}-${size}`.toUpperCase(),
          stock: 10,
          active: true,
        });
      }
    }
    await db.insert(schema.productVariants).values(variants);

    // Imagens placeholder
    await db.insert(schema.productImages).values([
      {
        productId: product.id,
        url: `https://placehold.co/600x800/efe7dd/6b6375?text=${encodeURIComponent(p.name)}`,
        alt: p.name,
        order: 0,
      },
      {
        productId: product.id,
        url: `https://placehold.co/600x800/e7e0ef/6b6375?text=${encodeURIComponent('Detalhe')}`,
        alt: `${p.name} — detalhe`,
        order: 1,
      },
    ]);

    console.log(`✅  Produto "${p.name}" criado com ${variants.length} variantes.`);
  }

  console.log('🎉 Seed concluído com sucesso!');
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Erro durante seed:', err);
  process.exit(1);
});
