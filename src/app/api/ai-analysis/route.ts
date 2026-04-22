import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'


export async function POST(request: Request) {
  try {
    const { type, data } = await request.json()

    const zai = await ZAI.create()

    let systemPrompt = ''
    let userMessage = ''

    if (type === 'memorization-analysis') {
      systemPrompt = `أنت محلل تعليمي متخصص في مراكز تحفيظ القرآن الكريم. مهمتك تحليل بيانات الحفظ وتقديم توصيات مفيدة باللغة العربية. كن مختصراً وعملياً في توصياتك. استخدم تنسيق واضح مع نقاط مرقمة.`
      userMessage = `حلل بيانات حفظ القرآن التالية وقدم تقريراً مفصلاً يتضمن:
1. 📊 ملخص عام للأداء
2. ✅ نقاط القوة (أفضل الطلاب والفروع)
3. ⚠️ نقاط تحتاج تحسين (الطلاب والفروع الأضعف)
4. 💡 توصيات عملية لتحسين الأداء
5. 🏆 ترتيب الفروع من الأفضل إلى الأضعف

البيانات:
${JSON.stringify(data, null, 2)}`
    } else {
      return NextResponse.json({ error: 'نوع التحليل غير معروف' }, { status: 400 })
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      thinking: { type: 'disabled' }
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json({ error: 'لم يتم الحصول على رد من الذكاء الاصطناعي' }, { status: 500 })
    }

    return NextResponse.json({ analysis: response })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: 'فشل في التحليل بالذكاء الاصطناعي' }, { status: 500 })
  }
}
