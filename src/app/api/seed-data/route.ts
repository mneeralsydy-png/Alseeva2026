import { sbGet, sbPost, sbDeleteAll, sbCount, sbPostMany } from '@/lib/supabase'
import { NextResponse } from 'next/server'


const HALAKAT_DATA = [
  { name: 'حلقة إيناس غالب قائد سعيد', teacher: 'إيناس غالب قائد سعيد', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة ختام سيف قاسم', teacher: 'ختام سيف قاسم', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة وحدة قحطان أحمد', teacher: 'وحدة قحطان أحمد', branch: 'الوادي', time: '', location: 'الوادي' },
  { name: 'حلقة مجيبة علي', teacher: 'مجيبة علي', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة أروى محمد عبد الله', teacher: 'أروى محمد عبد الله', branch: 'وبرة', time: '', location: 'وبرة' },
  { name: 'حلقة أمنيات', teacher: 'أمنيات', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة عمر علي', teacher: 'عمر علي', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة جواهر غالب', teacher: 'جواهر غالب', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة أفنان بسام', teacher: 'أفنان بسام', branch: 'ضية', time: '', location: 'ضية' },
  { name: 'حلقة حماس أحمد عبد الله', teacher: 'حماس أحمد عبد الله', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة هناء سعيد غالب', teacher: 'هناء سعيد غالب', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة أروى محمد عبد الولي نصر', teacher: 'أروى محمد عبد الولي نصر', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة نجيبة عبد الله قاسم', teacher: 'نجيبة عبد الله قاسم', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة الشيخ فخر الدين', teacher: 'الشيخ فخر الدين', branch: 'المنعم', time: '', location: 'المنعم' },
  { name: 'حلقة ماجدة منصور', teacher: 'ماجدة منصور', branch: 'ضية', time: '', location: 'ضية' },
  { name: 'حلقة فهنة عبد الله قاسم', teacher: 'فهنة عبد الله قاسم', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة وفاء قحطان محمد', teacher: 'وفاء قحطان محمد', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة أماني أحمد عبد الواحد', teacher: 'أماني أحمد عبد الواحد', branch: 'وبرة', time: '', location: 'وبرة' },
  { name: 'حلقة ألطاف محمد حسان', teacher: 'ألطاف محمد حسان', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة رغد سلطان قائد', teacher: 'رغد سلطان قائد', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة سيمون مبروك نعمان', teacher: 'سيمون مبروك نعمان', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة لبنان يحيى عبد الله', teacher: 'لبنان يحيى عبد الله', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة ثناء بسام أحمد', teacher: 'ثناء بسام أحمد', branch: 'المركز العام', time: '', location: 'المركز العام' },
  { name: 'حلقة سوسن الصوفي', teacher: 'سوسن الصوفي', branch: 'ضية', time: '', location: 'ضية' },
  { name: 'حلقة ردينا إبراهيم', teacher: 'ردينا إبراهيم', branch: 'السرور', time: '', location: 'السرور' },
  { name: 'حلقة راما خالد عبده', teacher: 'راما خالد عبده', branch: 'المركز العام', time: '', location: 'المركز العام' },
]

const STUDENTS_DATA: Record<string, { name: string; age: number; surah: string; category: string }[]> = {
  'حلقة إيناس غالب قائد سعيد': [
    { name: 'ركان أحمد قحطان', age: 13, surah: 'الأحقاف', category: '1-10' },
    { name: 'ريان أحمد قحطان', age: 16, surah: 'الطور', category: '1-10' },
    { name: 'عز الدين أحمد محمد', age: 14, surah: 'التحريم', category: '1-10' },
    { name: 'حمد عبد الله يحيى', age: 14, surah: 'الملك', category: '1-10' },
    { name: 'رأفت نبيل علي قائد', age: 5, surah: 'الجن', category: '1-10' },
    { name: 'رامي أحمد قحطان', age: 12, surah: 'المزمل', category: '1-10' },
    { name: 'محمد مأمون حسن محمد', age: 14, surah: 'القلم', category: '1-10' },
    { name: 'مراد مأمون حسن محمد', age: 11, surah: 'المزمل', category: '1-10' },
    { name: 'أنس سلطان قائد سعيد', age: 15, surah: 'المعارج', category: '1-10' },
    { name: 'نعمان قائد سعيد عبده', age: 11, surah: 'النبأ', category: '1-10' },
    { name: 'غسان مجيب سيف قاسم', age: 10, surah: 'الانشقاق', category: '1-10' },
    { name: 'عمر أمين سفيان عبده', age: 9, surah: 'الزلزلة', category: '1-10' },
  ],
  'حلقة ختام سيف قاسم': [
    { name: 'أبرار عبد الله قحطان', age: 11, surah: 'التغابن', category: '1-10' },
    { name: 'أحلام نجيب عبد الله', age: 12, surah: 'المزمل', category: '1-10' },
    { name: 'براءة فهيم سفيان', age: 11, surah: 'التغابن', category: '1-10' },
    { name: 'بشرى محمد عبد الجليل', age: 12, surah: 'الجن', category: '1-10' },
    { name: 'تيسير محفوظ عبد الله', age: 12, surah: 'الجن', category: '1-10' },
    { name: 'جنى معاذ سعيد علي', age: 13, surah: 'المزمل', category: '1-10' },
    { name: 'جماهير معاذ سعيد علي', age: 9, surah: 'المزمل', category: '1-10' },
    { name: 'حنان سعيد محمد سعد', age: 10, surah: 'الصف', category: '1-10' },
    { name: 'حنين سعيد محمد سعد', age: 10, surah: 'التغابن', category: '1-10' },
    { name: 'رهيب فهيم سفيان علي', age: 11, surah: 'التغابن', category: '1-10' },
    { name: 'سعاد أحمد مهيوب', age: 13, surah: 'الجن', category: '1-10' },
    { name: 'مازلين عبد الغني', age: 9, surah: 'الجن', category: '1-10' },
    { name: 'نسمة علي أحمد هزاع', age: 10, surah: 'المزمل', category: '1-10' },
    { name: 'هنده محمد سعيد غالب', age: 10, surah: 'الصف', category: '1-10' },
  ],
  'حلقة وحدة قحطان أحمد': [
    { name: 'خلود محفوظ عبده علي', age: 17, surah: 'الحج', category: '10-20' },
    { name: 'مروى مهيوب أحمد عبد الله', age: 17, surah: 'يس', category: '1-10' },
    { name: 'قبول بليغ سعيد سيف', age: 16, surah: 'الزمر', category: '1-10' },
    { name: 'سيماء محمد أحمد سعيد', age: 17, surah: 'الزمر', category: '1-10' },
    { name: 'سلى محمد أحمد سعيد', age: 12, surah: 'الذاريات', category: '1-10' },
    { name: 'رباء محمود عبده علي', age: 16, surah: 'الذاريات', category: '1-10' },
    { name: 'أماني منير عوض', age: 13, surah: 'المجادلة', category: '1-10' },
    { name: 'ثناء بسام أحمد علي', age: 13, surah: 'المجادلة', category: '1-10' },
    { name: 'ثريا عوض عبد القادر', age: 14, surah: 'المجادلة', category: '1-10' },
    { name: 'خلود خالد محمد عبده', age: 17, surah: 'المجادلة', category: '1-10' },
  ],
  'حلقة مجيبة علي': [
    { name: 'إيناس غالب قائد سعيد', age: 16, surah: 'يونس', category: '10-20' },
    { name: 'نفحة عبد الله محمد علي', age: 15, surah: 'الإسراء', category: '10-20' },
    { name: 'ملاك محمد عبده مقبل', age: 14, surah: 'النمل', category: '10-20' },
    { name: 'نورة إبراهيم محمد نصر', age: 13, surah: 'النمل', category: '10-20' },
    { name: 'بسمة منصور أحمد عبد الله', age: 14, surah: 'النمل', category: '10-20' },
    { name: 'فريال نبيل علي قائد', age: 19, surah: 'الزخرف', category: '1-10' },
    { name: 'سرور علي قحطان أحمد', age: 19, surah: 'الأحقاف', category: '1-10' },
    { name: 'أروى أحمد عبد الله محمد', age: 14, surah: 'الأحقاف', category: '1-10' },
    { name: 'وفاء قحطان محمد', age: 27, surah: 'الزخرف', category: '1-10' },
    { name: 'ريماس رضوان محمد هزاع', age: 18, surah: 'الملك', category: '1-10' },
  ],
  'حلقة أروى محمد عبد الله': [
    { name: 'إحسان إبراهيم حزام مهيوب', age: 13, surah: 'الطلاق', category: '1-10' },
    { name: 'أحمد مبارك علي عبد الجبار', age: 13, surah: 'الإنسان', category: '1-10' },
    { name: 'شروق محمد علي عبد الوارث', age: 15, surah: 'النبأ', category: '1-10' },
    { name: 'عز الدين أحمد عبده علي', age: 12, surah: 'التكوير', category: '1-10' },
    { name: 'البراء ثامر علي عبد الواحد', age: 11, surah: 'عبس', category: '1-10' },
    { name: 'مراد مبارك علي عبد الجبار', age: 11, surah: 'الشمس', category: '1-10' },
    { name: 'بيان محمد علي عبد الوارث', age: 9, surah: 'البينة', category: '1-10' },
    { name: 'أشجان مبارك علي عبد الجبار', age: 9, surah: 'البينة', category: '1-10' },
    { name: 'أسمر وليد علي عبد الواحد', age: 10, surah: 'البينة', category: '1-10' },
    { name: 'لؤي عمران حازم', age: 10, surah: 'البينة', category: '1-10' },
    { name: 'ريماس أحمد عبد الواحد', age: 13, surah: 'البروج', category: '1-10' },
  ],
  'حلقة أمنيات': [
    { name: 'مذهلة فؤاد سيف', age: 17, surah: 'الأنعام', category: '20-30' },
    { name: 'أفكار محمد عبد الله مهيوب', age: 20, surah: 'الأنعام', category: '20-30' },
    { name: 'افتكار محمد عبد الله مهيوب', age: 20, surah: 'الأنعام', category: '20-30' },
    { name: 'تسنيم محفوظ أحمد', age: 19, surah: 'طه', category: '10-20' },
    { name: 'مرام محفوظ أحمد', age: 10, surah: 'طه', category: '10-20' },
    { name: 'ليان عمار أحمد', age: 7, surah: 'المجادلة', category: '1-10' },
    { name: 'سندس محفوظ أحمد', age: 12, surah: 'الذاريات', category: '1-10' },
    { name: 'يسرى حسن عبد الله', age: 29, surah: 'الأحقاف', category: '1-10' },
    { name: 'عبير صادق سيف', age: 20, surah: 'الذاريات', category: '1-10' },
    { name: 'الماس محمد نصر', age: 20, surah: 'قريش', category: '1-10' },
  ],
  'حلقة عمر علي': [
    { name: 'أحمد محمد أحمد', age: 15, surah: 'المؤمنون', category: '10-20' },
    { name: 'المؤيد عمر علي طاهر', age: 16, surah: 'النمل', category: '10-20' },
    { name: 'إيهاب خالد أحمد هاشم', age: 16, surah: 'النمل', category: '10-20' },
    { name: 'خالد وليد محمد حسن', age: 15, surah: 'النمل', category: '10-20' },
    { name: 'ذا النون وليد محمد حسن', age: 14, surah: 'النور', category: '1-10' },
    { name: 'شادي فؤاد هزاع', age: 14, surah: 'فصلت', category: '1-10' },
    { name: 'عميد محمد سعيد سعيد', age: 17, surah: 'التحريم', category: '1-10' },
    { name: 'نشوان سيف هزاع', age: 16, surah: 'الأحزاب', category: '1-10' },
    { name: 'نصر الله عبد القوي هائل', age: 17, surah: 'التحريم', category: '1-10' },
    { name: 'نور الدين زاهر سيف هزاع', age: 16, surah: 'الفتح', category: '1-10' },
  ],
  'حلقة جواهر غالب': [
    { name: 'إرسال عبد الله أحمد', age: 18, surah: 'الروم', category: '1-10' },
    { name: 'طه نعمان سعيد', age: 13, surah: 'الأحقاف', category: '1-10' },
    { name: 'أنفال وضاح عبده علي', age: 13, surah: 'الملك', category: '1-10' },
    { name: 'توكل محمد عبد الجليل', age: 14, surah: 'المجادلة', category: '1-10' },
    { name: 'دعاء عبد الله عبده حزام', age: 17, surah: 'الذاريات', category: '1-10' },
    { name: 'عبير مبارك حسن عبده', age: 17, surah: 'الجاثية', category: '1-10' },
    { name: 'لبنان يحيى عبد الله', age: 11, surah: 'المجادلة', category: '1-10' },
    { name: 'ملاك أحمد عبده', age: 17, surah: 'المجادلة', category: '1-10' },
  ],
  'حلقة أفنان بسام': [
    { name: 'منار خالد أحمد هاشم', age: 8, surah: 'الملك', category: '1-10' },
    { name: 'بسمة مبروك نعمان', age: 9, surah: 'الملك', category: '1-10' },
    { name: 'روان زاهر سيف هزاع', age: 9, surah: 'الملك', category: '1-10' },
    { name: 'جنى صادق أحمد عبده', age: 10, surah: 'النبأ', category: '1-10' },
    { name: 'انس جعفر علي سعيد', age: 10, surah: 'النبأ', category: '1-10' },
    { name: 'إيلاف ناصر محمد عبده', age: 9, surah: 'النبأ', category: '1-10' },
    { name: 'بثينة عزيز علي طاهر', age: 9, surah: 'النبأ', category: '1-10' },
    { name: 'خلدون خالد محمد عبده', age: 9, surah: 'النبأ', category: '1-10' },
    { name: 'محمد خالد حسان', age: 9, surah: 'النبأ', category: '1-10' },
    { name: 'رفيدة أحمد علي غالب', age: 9, surah: 'النبأ', category: '1-10' },
  ],
  'حلقة حماس أحمد عبد الله': [
    { name: 'شعيب ناصر محمد عبد الولي', age: 13, surah: 'غافر', category: '1-10' },
    { name: 'ماهر طه سعيد سعيد', age: 12, surah: 'الشورى', category: '1-10' },
    { name: 'منتصر عبد الله أحمد علي', age: 13, surah: 'الحديد', category: '1-10' },
    { name: 'ذا النون أحمد أحمد', age: 14, surah: 'الحجرات', category: '1-10' },
    { name: 'وسام عماد فؤاد أحمد', age: 12, surah: 'الطور', category: '1-10' },
    { name: 'ألطاف محمد حسان حسن', age: 12, surah: 'الأحقاف', category: '1-10' },
    { name: 'أنهار عوض عبد القادر', age: 12, surah: 'الحديد', category: '1-10' },
    { name: 'أنهار عبد العليم حسن', age: 12, surah: 'الواقعة', category: '1-10' },
    { name: 'أريج عزيز أحمد بجاش', age: 11, surah: 'ق', category: '1-10' },
    { name: 'رويدا رمزي عبده هزاع', age: 11, surah: 'المنافقون', category: '1-10' },
  ],
  'حلقة هناء سعيد غالب': [
    { name: 'بليغ عمر علي طاهر', age: 11, surah: 'غافر', category: '1-10' },
    { name: 'زكريا زاهد مهيوب', age: 12, surah: 'الجاثية', category: '1-10' },
    { name: 'حسين فهمي فؤاد', age: 14, surah: 'فصلت', category: '1-10' },
    { name: 'حمد نائف محمد أحمد', age: 15, surah: 'فصلت', category: '1-10' },
    { name: 'عمار مختار علي غالب', age: 15, surah: 'غافر', category: '1-10' },
    { name: 'عبد الرحمن عبد الجليل هاشم', age: 15, surah: 'الجاثية', category: '1-10' },
    { name: 'مشتاق عبد الله سعيد', age: 15, surah: 'الدخان', category: '1-10' },
    { name: 'محمد خالد أحمد هاشم', age: 10, surah: 'الأحقاف', category: '1-10' },
    { name: 'أماني منير عوض', age: 11, surah: 'غافر', category: '1-10' },
    { name: 'خلود خالد محمد عبده', age: 10, surah: 'يس', category: '1-10' },
  ],
  'حلقة أروى محمد عبد الولي نصر': [
    { name: 'كوثر محمد أحمد عبد الولي', age: 20, surah: 'الواقعة', category: '1-10' },
    { name: 'صباح أحمد سعيد محمد', age: 18, surah: 'الصف', category: '1-10' },
    { name: 'ليالي يحيى نعمان عبد المجيد', age: 19, surah: 'المجادلة', category: '1-10' },
    { name: 'جواهر قائد سعيد عبده', age: 14, surah: 'الحديد', category: '1-10' },
    { name: 'نوارة عبد الباري عبد الله', age: 21, surah: 'الملك', category: '1-10' },
    { name: 'أروى محمد عبد الله محمد', age: 19, surah: 'الصف', category: '1-10' },
    { name: 'أمة الرحمن عبد الله يحيى', age: 11, surah: 'نوح', category: '1-10' },
    { name: 'رغد سلطان قائد سعيد عبده', age: 20, surah: 'المزمل', category: '1-10' },
    { name: 'معالي يحيى نعمان', age: 10, surah: 'القيامة', category: '1-10' },
    { name: 'ردينا عبد الولي سفيان', age: 14, surah: 'الجن', category: '1-10' },
  ],
  'حلقة نجيبة عبد الله قاسم': [
    { name: 'أفراح محمد عباس قاسم', age: 40, surah: 'الملك', category: 'محو الامية' },
    { name: 'أفراح سعيد عبده مهيوب', age: 36, surah: 'الحديد', category: 'محو الامية' },
    { name: 'رقية أمير محمد حسان', age: 51, surah: 'سبأ', category: 'محو الامية' },
    { name: 'عزيزة سيف محمد قاسم', age: 45, surah: 'الأنبياء', category: 'محو الامية' },
    { name: 'فاطمة علي أحمد حسان', age: 52, surah: 'القلم', category: 'محو الامية' },
    { name: 'فائدة سيف علي شمسان', age: 35, surah: 'المجادلة', category: 'محو الامية' },
    { name: 'فلة سفيان عبده غالب', age: 50, surah: 'ص', category: 'محو الامية' },
    { name: 'مسك قحطان أحمد', age: 45, surah: 'الطلاق', category: 'محو الامية' },
    { name: 'نعيم محمد نصر', age: 60, surah: 'النمل', category: 'محو الامية' },
    { name: 'نعمة أحمد حسان', age: 59, surah: 'الزخرف', category: 'محو الامية' },
  ],
  'حلقة الشيخ فخر الدين': [
    { name: 'عمر عبد العليم حسان يحيى', age: 31, surah: 'الزمر', category: '1-10' },
    { name: 'عفيف منصور عبد الله سنان', age: 27, surah: 'فاطر', category: '1-10' },
    { name: 'رشاد شهاب مهيوب حسن', age: 25, surah: 'الأحقاف', category: '1-10' },
    { name: 'يحيى علي محمد منصر', age: 18, surah: 'الذاريات', category: '1-10' },
    { name: 'رحاب منصور أحمد قاسم', age: 29, surah: 'البقرة', category: '20-30' },
    { name: 'إيمان سلطان محمد عبد الله', age: 40, surah: 'النساء', category: '30-20' },
    { name: 'بدور عبده قاسم مقبل', age: 38, surah: 'البقرة', category: '20-30' },
    { name: 'مبروكة حسن مهوب أحمد', age: 40, surah: 'النساء', category: '20-30' },
    { name: 'أسماء حسان يحيى المقدم', age: 35, surah: 'النساء', category: '20-30' },
    { name: 'مقادير عبد المؤمن ذياب', age: 40, surah: 'الشورى', category: '10-20' },
  ],
  'حلقة ماجدة منصور': [
    { name: 'أنس عبد الله أحمد غالب', age: 14, surah: 'القمر', category: '1-10' },
    { name: 'أشرف خالد حسان', age: 14, surah: 'الزخرف', category: '1-10' },
    { name: 'أسيد معاذ محمد هزاع', age: 15, surah: 'الأحقاف', category: '1-10' },
    { name: 'أويس صادق أحمد', age: 13, surah: 'التحريم', category: '1-10' },
    { name: 'ربيع محيي الدين مهيوب', age: 11, surah: 'الأحقاف', category: '1-10' },
    { name: 'زاهر سمير عوض عبده', age: 12, surah: 'الجمعة', category: '1-10' },
    { name: 'علوي عبد الجليل هاشم', age: 15, surah: 'الطور', category: '1-10' },
    { name: 'مهند محمد سعيد سعيد', age: 14, surah: 'التغابن', category: '1-10' },
    { name: 'نجيب الصوفي نعمان هزاع', age: 15, surah: 'ق', category: '1-10' },
    { name: 'إحسان عكاشة سيف', age: 12, surah: 'الذاريات', category: '1-10' },
  ],
  'حلقة فهنة عبد الله قاسم': [
    { name: 'شوقي هائل سعيد', age: 11, surah: 'الأحقاف', category: '1-10' },
    { name: 'أسامة ياسين عبد الله', age: 10, surah: 'التحريم', category: '1-10' },
    { name: 'أريج منصور عبده علي', age: 12, surah: 'الأحقاف', category: '1-10' },
    { name: 'بشرى مبارك أبا الحسن', age: 11, surah: 'الفتح', category: '1-10' },
    { name: 'بسمة مبارك أبا الحسن', age: 11, surah: 'الفتح', category: '1-10' },
    { name: 'تحف ياسين عبد الله', age: 10, surah: 'محمد', category: '1-10' },
    { name: 'راقي علي أمير محمد حسان', age: 10, surah: 'الجمعة', category: '1-10' },
    { name: 'سلمية خالد حزام أحمد', age: 10, surah: 'الصف', category: '1-10' },
    { name: 'ردينا إبراهيم محمد نصر', age: 9, surah: 'الملك', category: '1-10' },
  ],
  'حلقة وفاء قحطان محمد': [
    { name: 'أسماء محمد عبده مقبل', age: 19, surah: 'يونس', category: '10-20' },
    { name: 'أماني منصور أحمد عبد الله', age: 18, surah: 'الإسراء', category: '10-20' },
    { name: 'أنهار ياسين إسماعيل عبده', age: 17, surah: 'النمل', category: '10-20' },
    { name: 'ريهام نبيل علي قائد', age: 16, surah: 'النمل', category: '10-20' },
    { name: 'بلقيس أحمد عبد الله', age: 16, surah: 'النمل', category: '10-20' },
    { name: 'غادة فؤاد سيف محمد', age: 15, surah: 'الزخرف', category: '1-10' },
    { name: 'هدى علي قحطان أحمد', age: 14, surah: 'الأحقاف', category: '1-10' },
    { name: 'ياسمين أحمد عبد الله', age: 13, surah: 'الأحقاف', category: '1-10' },
    { name: 'إيمان قحطان محمد', age: 12, surah: 'الزخرف', category: '1-10' },
    { name: 'مروى رضوان محمد هزاع', age: 11, surah: 'الملك', category: '1-10' },
  ],
  'حلقة أماني أحمد عبد الواحد': [
    { name: 'يونس إبراهيم حزام مهيوب', age: 12, surah: 'الطلاق', category: '1-10' },
    { name: 'محمد مبارك علي عبد الجبار', age: 10, surah: 'الإنسان', category: '1-10' },
    { name: 'خديجة محمد علي عبد الوارث', age: 11, surah: 'النبأ', category: '1-10' },
    { name: 'أسامة أحمد عبده علي', age: 9, surah: 'التكوير', category: '1-10' },
    { name: 'إياد ثامر علي عبد الواحد', age: 8, surah: 'عبس', category: '1-10' },
    { name: 'عمار مبارك علي عبد الجبار', age: 7, surah: 'الشمس', category: '1-10' },
    { name: 'رتيل محمد علي عبد الوارث', age: 6, surah: 'البينة', category: '1-10' },
    { name: 'شهد مبارك علي عبد الجبار', age: 10, surah: 'البينة', category: '1-10' },
    { name: 'يحيى وليد علي عبد الواحد', age: 9, surah: 'البينة', category: '1-10' },
  ],
  'حلقة ألطاف محمد حسان': [
    { name: 'آدم ناصر محمد عبد الولي', age: 11, surah: 'غافر', category: '1-10' },
    { name: 'كنعان طه سعيد سعيد', age: 10, surah: 'الشورى', category: '1-10' },
    { name: 'لؤي عبد الله أحمد علي', age: 12, surah: 'الحديد', category: '1-10' },
    { name: 'يوسف علي سعيد', age: 9, surah: 'المجادلة', category: '1-10' },
    { name: 'ريان أحمد أحمد', age: 13, surah: 'الحجرات', category: '1-10' },
    { name: 'قيس عماد فؤاد أحمد', age: 10, surah: 'الطور', category: '1-10' },
    { name: 'رهف محمد حسان حسن', age: 11, surah: 'الأحقاف', category: '1-10' },
    { name: 'ريتاج عوض عبد القادر', age: 9, surah: 'الحديد', category: '1-10' },
    { name: 'ماريا عبد العليم حسن', age: 8, surah: 'الواقعة', category: '1-10' },
  ],
  'حلقة رغد سلطان قائد': [
    { name: 'أروى محمد أحمد عبد الولي', age: 15, surah: 'الواقعة', category: '1-10' },
    { name: 'بلقيس أحمد سعيد محمد', age: 14, surah: 'الصف', category: '1-10' },
    { name: 'هاجر يحيى نعمان عبد المجيد', age: 16, surah: 'المجادلة', category: '1-10' },
    { name: 'صفاء قائد سعيد عبده', age: 13, surah: 'الحديد', category: '1-10' },
    { name: 'شيماء عبد الباري عبد الله', age: 12, surah: 'الملك', category: '1-10' },
    { name: 'تقى محمد عبد الله محمد', age: 11, surah: 'الصف', category: '1-10' },
    { name: 'مريم عبد الله يحيى', age: 10, surah: 'نوح', category: '1-10' },
    { name: 'ذكرى سلطان قائد سعيد', age: 14, surah: 'المزمل', category: '1-10' },
  ],
  'حلقة سيمون مبروك نعمان': [
    { name: 'مائسة فيصل أحمد', age: 14, surah: 'الأحزاب', category: '1-10' },
    { name: 'مروى عبد الله يحيى', age: 13, surah: 'الأحزاب', category: '1-10' },
    { name: 'رويدا رمزي عبده هزاع', age: 11, surah: 'المنافقون', category: '1-10' },
    { name: 'أريج عزيز أحمد بجاش', age: 11, surah: 'ق', category: '1-10' },
    { name: 'أنهار عبد العليم حسن', age: 12, surah: 'الواقعة', category: '1-10' },
    { name: 'أنهار عوض عبد القادر', age: 12, surah: 'الحديد', category: '1-10' },
    { name: 'ألطاف محمد حسان حسن', age: 12, surah: 'الأحقاف', category: '1-10' },
  ],
  'حلقة لبنان يحيى عبد الله': [
    { name: 'ملاك أحمد عبده', age: 17, surah: 'المجادلة', category: '1-10' },
    { name: 'عبير مبارك حسن عبده', age: 17, surah: 'الجاثية', category: '1-10' },
    { name: 'دعاء عبد الله عبده حزام', age: 17, surah: 'الذاريات', category: '1-10' },
    { name: 'توكل محمد عبد الجليل', age: 14, surah: 'المجادلة', category: '1-10' },
    { name: 'أنفال وضاح عبده علي', age: 13, surah: 'الملك', category: '1-10' },
  ],
  'حلقة ثناء بسام أحمد': [
    { name: 'ثريا عوض عبد القادر', age: 12, surah: 'فصلت', category: '1-10' },
    { name: 'خلود خالد محمد عبده', age: 10, surah: 'يس', category: '1-10' },
    { name: 'أماني منير عوض', age: 11, surah: 'غافر', category: '1-10' },
    { name: 'مشتاق عبد الله سعيد', age: 15, surah: 'الدخان', category: '1-10' },
  ],
  'حلقة سوسن الصوفي': [
    { name: 'تسنيم صادق أحمد عبده', age: 14, surah: 'الحجرات', category: '1-10' },
    { name: 'إحسان عكاشة سيف', age: 12, surah: 'الذاريات', category: '1-10' },
    { name: 'نجيب الصوفي نعمان هزاع', age: 15, surah: 'ق', category: '1-10' },
    { name: 'علوي عبد الجليل هاشم', age: 15, surah: 'الطور', category: '1-10' },
  ],
  'حلقة ردينا إبراهيم': [
    { name: 'سلمية خالد حزام', age: 10, surah: 'الصف', category: '1-10' },
    { name: 'راقي علي أمير', age: 10, surah: 'الجمعة', category: '1-10' },
    { name: 'تحف ياسين عبد الله', age: 10, surah: 'محمد', category: '1-10' },
  ],
  'حلقة راما خالد عبده': [
    { name: 'عبير خالد حزام', age: 10, surah: 'الطارق', category: '1-10' },
    { name: 'فطوم منصور أحمد', age: 13, surah: 'النبأ', category: '1-10' },
    { name: 'ردينا عبد الولي سفيان', age: 14, surah: 'الجن', category: '1-10' },
  ],
}

export async function GET(request: Request) {
  try {
    // Safety check: only run with explicit confirm parameter
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    if (confirm !== 'true') {
      return NextResponse.json({ 
        message: 'هذا المسار يحتاج تأكيد. استخدم ?confirm=true لإعادة تحميل البيانات' 
      })
    }

    const existingCount = await sbCount('Halaka')

    if (existingCount > 0) {
      await sbDeleteAll('Attendance')
      await sbDeleteAll('Student')
      await sbDeleteAll('Halaka')
    }

    // Seed admin accounts
    const adminCount = await sbCount('Admin')
    if (adminCount === 0) {
      await sbPost('Admin', { username: 'Am2026', password: process.env.ADMIN_DEFAULT_PASSWORD || 'changeme', name: 'المدير' })
      await sbPost('Admin', { username: 'Hi', password: 'Hi123', name: 'العرض العام' })
    }

    // Create halakat and students
    let totalStudents = 0
    let totalErrors = 0

    for (const halakaData of HALAKAT_DATA) {
      const halaka = await sbPost('Halaka', {
        name: halakaData.name,
        teacher: halakaData.teacher,
        branch: halakaData.branch,
        time: halakaData.time,
        location: halakaData.location,
      })

      const students = STUDENTS_DATA[halakaData.name] || []
      for (const s of students) {
        try {
          await sbPost('Student', {
            name: s.name,
            age: s.age,
            surah: s.surah,
            category: s.category,
            halakaId: halaka.id,
            parentName: '',
            parentPhone: '',
          })
          totalStudents++
        } catch (studentError) {
          totalErrors++
          console.error(`Failed to create student ${s.name}:`, studentError)
        }
      }
    }

    return NextResponse.json({
      message: 'تم تحميل البيانات بنجاح',
      halakatCount: HALAKAT_DATA.length,
      studentsCount: totalStudents,
      errors: totalErrors,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'فشل في تحميل البيانات', details: String(error) }, { status: 500 })
  }
}
