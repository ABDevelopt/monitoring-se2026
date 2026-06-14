// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const usedUsernames = new Set<string>();
function generateUsername(name: string): string {
  let base = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!base) base = 'user';
  let username = base;
  let counter = 1;
  while (usedUsernames.has(username)) {
    username = `${base}${counter}`;
    counter++;
  }
  usedUsernames.add(username);
  return username;
}

async function main() {
  console.log('Clearing database...');
  
  // Delete in order to avoid foreign key violations
  await prisma.laporan.deleteMany({});
  await prisma.tugasPcl.deleteMany({});
  await prisma.target.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subSls.deleteMany({});
  await prisma.sls.deleteMany({});
  await prisma.desa.deleteMany({});
  await prisma.kecamatan.deleteMany({});

  console.log('Database cleared.');

  // Load JSON file
  const filePath = path.join(process.cwd(), 'kelompok_populasi_pml_pcl_korlap_muatan.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  console.log('Processing JSON data and seeding...');

  // Hash password for default users
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  // We need to keep track of unique korlaps, pmls, pcls and their relations
  const korlaps = new Set<string>();
  const pmlsMap = new Map<string, { nama: string; kecamatanKode: string }>(); // pmlName -> details
  const pcls = new Set<string>();
  
  // Map from normalized PCL name to their assigned sub-SLS database IDs
  const pclAssignments = new Map<string, number[]>();

  // Iterasi Kecamatan -> Desa -> SLS -> Sub-SLS
  for (const kec of data) {
    const dbKec = await prisma.kecamatan.create({
      data: {
        kodeKec: kec.kode_kec,
        namaKec: kec.nama_kec,
      },
    });

    for (const d of kec.desa) {
      const dbDesa = await prisma.desa.create({
        data: {
          idKecamatan: dbKec.id,
          idDesa: d.id_desa,
          kodeDesa: d.kode_desa,
          namaDesa: d.nama_desa,
        },
      });

      for (const s of d.sls) {
        const dbSls = await prisma.sls.create({
          data: {
            idDesa: dbDesa.id,
            kodeSls: s.kode_sls,
            namaSls: s.nama_sls,
          },
        });

        for (const sub of s.subsls) {
          const normKorlap = normalizeName(sub.nama_korlap);
          const normPml = normalizeName(sub.nama_pml);
          const normPcl = normalizeName(sub.nama_pcl);

          if (normKorlap) korlaps.add(normKorlap);
          if (normPml) {
            pmlsMap.set(normPml, {
              nama: normPml,
              kecamatanKode: kec.kode_kec,
            });
          }
          if (normPcl) pcls.add(normPcl);

          const dbSubSls = await prisma.subSls.create({
            data: {
              idSls: dbSls.id,
              kodeSubsls: sub.kode_subsls,
              idSubsls: sub.id_subsls,
              idSubsls2025: sub.id_subsls_2025 || null,
              namaKorlap: normKorlap,
              namaPml: normPml,
              namaPcl: normPcl,
              totalMuatanAssignment: sub.total_muatan_assignment || 0,
            },
          });

          if (normPcl) {
            if (!pclAssignments.has(normPcl)) {
              pclAssignments.set(normPcl, []);
            }
            pclAssignments.get(normPcl)!.push(dbSubSls.id);
          }
        }
      }
    }
  }

  console.log('Master data loaded. Seeding users...');

  // 1. Seed Admin
  const adminUser = await prisma.user.create({
    data: {
      nama: 'Admin BPS PPU',
      username: 'admin',
      passwordHash: defaultPasswordHash,
      role: 'admin',
    },
  });
  console.log(`Created Admin user: ${adminUser.username}`);

  // 2. Seed Korlaps
  for (const korlapName of korlaps) {
    const username = generateUsername(korlapName);
    await prisma.user.create({
      data: {
        nama: korlapName,
        username,
        passwordHash: defaultPasswordHash,
        role: 'korlap',
      },
    });
  }
  console.log(`Seeded ${korlaps.size} Korlap users.`);

  // 3. Seed PMLs
  const dbKecamatanList = await prisma.kecamatan.findMany();
  const kecMap = new Map(dbKecamatanList.map(k => [k.kodeKec, k.id]));

  for (const [pmlName, details] of pmlsMap.entries()) {
    const username = generateUsername(pmlName);
    const kecId = kecMap.get(details.kecamatanKode) || null;
    await prisma.user.create({
      data: {
        nama: pmlName,
        username,
        passwordHash: defaultPasswordHash,
        role: 'pml',
        idKecamatan: kecId,
      },
    });
  }
  console.log(`Seeded ${pmlsMap.size} PML users.`);

  // 4. Seed PCLs and their assignments
  let pclUserCount = 0;
  let assignmentCount = 0;

  for (const pclName of pcls) {
    const username = generateUsername(pclName);
    const dbPclUser = await prisma.user.create({
      data: {
        nama: pclName,
        username,
        passwordHash: defaultPasswordHash,
        role: 'pcl',
      },
    });
    pclUserCount++;

    const subSlsIds = pclAssignments.get(pclName) || [];
    for (const subSlsId of subSlsIds) {
      await prisma.tugasPcl.create({
        data: {
          idUser: dbPclUser.id,
          idSubsls: subSlsId,
        },
      });
      assignmentCount++;
    }
  }
  console.log(`Seeded ${pclUserCount} PCL users with ${assignmentCount} total assignments.`);

  // 5. Seed Target data for each Kecamatan
  // Default Target: 100% from June 1, 2026 to July 31, 2026
  const tanggalMulai = new Date('2026-06-15');
  const tanggalSelesai = new Date('2026-08-31');

  for (const kec of dbKecamatanList) {
    await prisma.target.create({
      data: {
        idKecamatan: kec.id,
        targetSelesaiPersen: 100.0,
        tanggalMulai,
        tanggalSelesai,
      },
    });
  }
  console.log('Seeded target completion data for each kecamatan.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
