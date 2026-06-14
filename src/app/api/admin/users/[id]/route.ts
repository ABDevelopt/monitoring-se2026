// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'ID user tidak valid' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { nama, username, password, role, idKecamatan, isActive, subSlsIds } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    const cleanUsername = username?.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Cek duplikasi username jika username diganti
    if (cleanUsername && cleanUsername !== user.username) {
      const dupe = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });
      if (dupe) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
      }
    }

    // Siapkan update data
    const updateData: any = {};
    if (nama) updateData.nama = nama;
    if (cleanUsername) updateData.username = cleanUsername;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    if (role === 'pml') {
      updateData.idKecamatan = idKecamatan ? parseInt(idKecamatan) : null;
    } else {
      updateData.idKecamatan = null;
    }

    // Reset password jika disediakan
    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Jalankan update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Jalankan update tugas PCL jika role PCL
    if (role === 'pcl' && Array.isArray(subSlsIds)) {
      // Hapus semua penugasan lama
      await prisma.tugasPcl.deleteMany({
        where: { idUser: userId },
      });

      // Tambahkan penugasan baru
      if (subSlsIds.length > 0) {
        await Promise.all(
          subSlsIds.map((subId: number) =>
            prisma.tugasPcl.create({
              data: {
                idUser: userId,
                idSubsls: subId,
              },
            })
          )
        );
      }
    }

    const { passwordHash: _, ...sanitizedUser } = updatedUser;
    return NextResponse.json({ success: true, user: sanitizedUser });

  } catch (error) {
    console.error('API admin update user error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak terautorisasi' }, { status: 401 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'ID user tidak valid' }, { status: 400 });
  }

  // Cegah menghapus akun admin sendiri
  if (session.userId === userId) {
    return NextResponse.json({ error: 'Tidak dapat menghapus akun admin Anda sendiri' }, { status: 400 });
  }

  try {
    // Hapus relasi penugasan PCL dulu
    await prisma.tugasPcl.deleteMany({
      where: { idUser: userId },
    });

    // Hapus user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API admin delete user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
  }
}
