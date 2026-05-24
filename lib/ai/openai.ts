import OpenAI from 'openai'
import { env } from '../config/env'

// إنشاء عميل OpenAI
export const openai = new OpenAI({
  apiKey: env.openaiApiKey,
})

// ===== توليد الأسئلة المخصصة =====
export async function generateCustomQuestions(
  cvSummary: string,
  jobDescription: string,
  requirements: string,
  skills: string[],
  languageLevel: string,
  language: 'ar' | 'en' | 'mixed'
) {
  const prompt = `
أنت خبير مقابلات موارد بشرية متخصص. قم بإنشاء 8-10 أسئلة مقابلة ذكية ومتخصصة بناءً على المعلومات التالية:

السيرة الذاتية: ${cvSummary}
وصف الوظيفة: ${jobDescription}
المتطلبات: ${requirements}
المهارات المذكورة: ${skills.join(', ')}
مستوى اللغة: ${languageLevel}

يجب أن تكون الأسئلة:
- مخصصة لخبرة المرشح المحددة
- متعلقة مباشرة بمتطلبات الوظيفة
- تطلب أمثلة عملية فعلية
- تختبر المهارات المذكورة في السيرة الذاتية
- مناسبة لمستوى اللغة: ${languageLevel}

أرجع الإجابة كـ JSON مع مصفوفة من الأسئلة (كل سؤال يحتوي على question, category, difficulty):
[{"question": "...", "questionAr": "...", "category": "skill|experience|culture|language", "difficulty": "easy|medium|hard"}]
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  try {
    const content = response.choices[0].message.content
    if (!content) throw new Error('No content in response')
    
    // استخراج JSON من الرد
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error parsing questions:', error)
    return []
  }
}

// ===== تقييم الإجابة =====
export async function evaluateAnswer(
  question: string,
  answer: string,
  jobDescription: string,
  expectedLevel: string
) {
  const prompt = `
أ��ت خبير تقييم مقابلات متخصص في الموارد البشرية.

السؤال: ${question}
إجابة المرشح: ${answer}
وصف الوظيفة: ${jobDescription}
المستوى المتوقع: ${expectedLevel}

قيّم الإجابة بناءً على:
1. وضوح الإجابة (0-20)
2. الارتباط بالسؤال (0-20)
3. وجود أمثلة عملية (0-20)
4. الخبرة الفعلية (0-20)
5. مهارات التواصل (0-20)

أرجع الرد كـ JSON:
{
  "score": 0-100,
  "clarity": 0-20,
  "relevance": 0-20,
  "examples": 0-20,
  "experience": 0-20,
  "communication": 0-20,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "followUpQuestion": "...",
  "feedback": "..."
}
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 1000,
  })

  try {
    const content = response.choices[0].message.content
    if (!content) throw new Error('No content in response')
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error evaluating answer:', error)
    return {
      score: 0,
      strengths: [],
      weaknesses: [],
      feedback: 'حدث خطأ في التقييم',
    }
  }
}

// ===== تحليل السيرة الذاتية =====
export async function analyzeCV(cvText: string) {
  const prompt = `
قم بتحليل السيرة الذاتية التالية واستخرج المعلومات المهمة:

${cvText}

أرجع الرد كـ JSON مع البيانات التالية:
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "city": "...",
  "education": "...",
  "specialization": "...",
  "yearsOfExperience": 0,
  "lastPosition": "...",
  "skills": ["...", "..."],
  "certifications": ["...", "..."],
  "expectedSalary": 0,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "pointsToVerify": ["...", "..."]
}
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  })

  try {
    const content = response.choices[0].message.content
    if (!content) throw new Error('No content in response')
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error analyzing CV:', error)
    return {}
  }
}

// ===== إصدار التقييم النهائي =====
export async function generateFinalEvaluation(
  candidateSummary: string,
  interviewResponses: any[],
  jobDescription: string,
  requirements: string
) {
  const responsesText = interviewResponses
    .map((r) => `Q: ${r.question}\nA: ${r.answer}\nScore: ${r.answerScore}/100`)
    .join('\n\n')

  const prompt = `
كخبير في الموارد البشرية، قيّم مدى مناسبة المرشح للوظيفة:

بيانات المرشح: ${candidateSummary}

إجابات المقابلة:
${responsesText}

وصف الوظيفة: ${jobDescription}
المتطلبات: ${requirements}

حدد:
1. المدى الإجمالي (0-100)
2. التصنيف: مناسب جداً | مناسب | مناسب بشروط | احتياطي | غير مناسب
3. نقاط القوة الرئيسية
4. نقاط الضعف المهمة
5. المخاطر المحتملة
6. التوصية النهائية

أرجع الرد كـ JSON:
{
  "overallScore": 0-100,
  "suitability": "very-suitable|suitable|conditional|reserve|unsuitable",
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "risks": ["...", "..."],
  "recommendation": "...",
  "reasonsForRating": "..."
}
  `

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 1500,
  })

  try {
    const content = response.choices[0].message.content
    if (!content) throw new Error('No content in response')
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error generating evaluation:', error)
    return {
      overallScore: 0,
      suitability: 'unsuitable',
      strengths: [],
      weaknesses: [],
      risks: [],
      recommendation: 'يتطلب مراجعة يدوية',
    }
  }
}
