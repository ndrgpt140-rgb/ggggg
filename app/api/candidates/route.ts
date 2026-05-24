// API Endpoints للمرشحين

import { NextRequest, NextResponse } from 'next/server'
import { candidatesTable } from '@/lib/db/supabase'

// POST: إضافة مرشح جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      city,
      education,
      specialization,
      yearsOfExperience,
      lastPosition,
      skills,
      certifications,
      expectedSalary,
      cvUrl,
      jobId,
    } = body

    // التحقق من البيانات المطلوبة
    if (!name || !email || !jobId) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة ناقصة' },
        { status: 400 }
      )
    }

    // إدراج المرشح الجديد
    const { data, error } = await candidatesTable().insert({
      name,
      email,
      phone,
      city,
      education,
      specialization,
      years_of_experience: yearsOfExperience,
      last_position: lastPosition,
      skills,
      certifications,
      expected_salary: expectedSalary,
      cv_url: cvUrl,
      job_id: jobId,
      created_at: new Date(),
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'تم إضافة المرشح بنجاح',
      data,
    })
  } catch (error) {
    console.error('Error adding candidate:', error)
    return NextResponse.json(
      { error: 'خطأ في إضافة المرشح' },
      { status: 500 }
    )
  }
}

// GET: جلب المرشحين
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const candidateId = searchParams.get('candidateId')

    let query = candidatesTable().select('*')

    if (candidateId) {
      query = query.eq('id', candidateId)
      const { data, error } = await query.single()
      if (error) {
        return NextResponse.json({ error: 'لم يتم العثور على المرشح' }, { status: 404 })
      }
      return NextResponse.json(data)
    }

    if (jobId) {
      query = query.eq('job_id', jobId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب المرشحين' },
      { status: 500 }
    )
  }
}

// PUT: تحديث بيانات المرشح
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'معرف المرشح مفقود' }, { status: 400 })
    }

    const { data, error } = await candidatesTable()
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'تم تحديث بيانات المرشح بنجاح',
      data,
    })
  } catch (error) {
    console.error('Error updating candidate:', error)
    return NextResponse.json(
      { error: 'خطأ في تحديث البيانات' },
      { status: 500 }
    )
  }
}

// DELETE: حذف المرشح
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get('candidateId')

    if (!candidateId) {
      return NextResponse.json({ error: 'معرف المرشح مفقود' }, { status: 400 })
    }

    const { error } = await candidatesTable().delete().eq('id', candidateId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'تم حذف المرشح بنجاح',
    })
  } catch (error) {
    console.error('Error deleting candidate:', error)
    return NextResponse.json(
      { error: 'خطأ في حذف المرشح' },
      { status: 500 }
    )
  }
}
