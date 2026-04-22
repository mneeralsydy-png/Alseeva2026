import { sbGet, sbCount } from '@/lib/supabase'
import { NextResponse } from 'next/server'


interface MonthlyStudent {
  name: string
  halakaName: string
  branch: string
  presentDays: number
  totalDays: number
  rate: number
}

interface BranchData {
  name: string
  rate: number
  students: MonthlyStudent[]
}

// GET monthly memorization rate statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')

    // Parse month (YYYY-MM)
    const now = new Date()
    const year = monthParam ? parseInt(monthParam.split('-')[0]) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam.split('-')[1]) : now.getMonth() + 1

    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`

    // Calculate end of month
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Fetch attendance records for this month (present only = حاضر)
    // Supabase filter: date=gte.startDate&date=lte.endDate
    const [attendanceRecords, students, halakat] = await Promise.all([
      sbGet<any>('Attendance', `date=gte.${startDate}&date=lte.${endDate}&order=createdAt.desc`),
      sbGet<any>('Student', 'select=id,name,halakaId'),
      sbGet<any>('Halaka', 'select=id,name,branch'),
    ])

    // Build lookup maps
    const studentMap = new Map(students.map((s: any) => [s.id, s]))
    const halakaMap = new Map(halakat.map((h: any) => [h.id, h]))

    // Group attendance by studentId
    const studentAttendance = new Map<string, { presentDays: number; totalDays: number; halakaId?: string }>()

    for (const record of attendanceRecords) {
      const sid = record.studentId
      if (!sid) continue

      if (!studentAttendance.has(sid)) {
        studentAttendance.set(sid, { presentDays: 0, totalDays: 0, halakaId: record.halakaId || undefined })
      }

      const entry = studentAttendance.get(sid)!

      // Track unique dates using a set approach via the attendance record itself
      // Each record is one day's attendance for one student
      entry.totalDays += 1
      if (record.status === 'حاضر') {
        entry.presentDays += 1
      }

      // Keep the latest halakaId
      if (record.halakaId) {
        entry.halakaId = record.halakaId
      }
    }

    // Build per-student results
    const allStudents: MonthlyStudent[] = []
    const branchMap = new Map<string, MonthlyStudent[]>()

    for (const [studentId, attendanceData] of studentAttendance) {
      const student = studentMap.get(studentId)
      if (!student) continue

      const halaka = attendanceData.halakaId ? halakaMap.get(attendanceData.halakaId) : undefined
      const halakaName = halaka ? halaka.name : '—'
      const branch = halaka ? (halaka.branch || 'غير محدد') : 'غير محدد'

      const rate = attendanceData.totalDays > 0
        ? Math.round((attendanceData.presentDays / attendanceData.totalDays) * 100)
        : 0

      const studentData: MonthlyStudent = {
        name: student.name,
        halakaName,
        branch,
        presentDays: attendanceData.presentDays,
        totalDays: attendanceData.totalDays,
        rate,
      }

      allStudents.push(studentData)

      if (!branchMap.has(branch)) {
        branchMap.set(branch, [])
      }
      branchMap.get(branch)!.push(studentData)
    }

    // Also add students with no attendance records for the month
    // They get rate 0
    for (const student of students) {
      if (!studentAttendance.has(student.id)) {
        const halaka = student.halakaId ? halakaMap.get(student.halakaId) : undefined
        const halakaName = halaka ? halaka.name : '—'
        const branch = halaka ? (halaka.branch || 'غير محدد') : 'غير محدد'

        const studentData: MonthlyStudent = {
          name: student.name,
          halakaName,
          branch,
          presentDays: 0,
          totalDays: 0,
          rate: 0,
        }

        allStudents.push(studentData)

        if (!branchMap.has(branch)) {
          branchMap.set(branch, [])
        }
        branchMap.get(branch)!.push(studentData)
      }
    }

    // Build branch data with rates
    const branches: BranchData[] = []
    let totalRateSum = 0
    let totalRateCount = 0

    for (const [branchName, branchStudents] of branchMap) {
      const branchRate = branchStudents.length > 0
        ? Math.round(branchStudents.reduce((sum, s) => sum + s.rate, 0) / branchStudents.length)
        : 0

      // Sort students by rate descending
      branchStudents.sort((a, b) => b.rate - a.rate)

      branches.push({
        name: branchName,
        rate: branchRate,
        students: branchStudents,
      })

      totalRateSum += branchRate
      totalRateCount += 1
    }

    // Sort branches by rate descending
    branches.sort((a, b) => b.rate - a.rate)

    const overallRate = totalRateCount > 0 ? Math.round(totalRateSum / totalRateCount) : 0

    return NextResponse.json({
      month: monthStr,
      totalStudents: allStudents.length,
      overallRate,
      branches,
    })
  } catch (error) {
    console.error('Monthly rate error:', error)
    return NextResponse.json({ error: 'فشل في تحميل معدل الحفظ الشهري' }, { status: 500 })
  }
}
