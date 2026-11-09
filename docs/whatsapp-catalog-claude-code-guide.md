# WhatsApp Product Catalog — دليل البناء باستخدام Claude Code

هذا الملف يحتوي على خطوات إنشاء المشروع من الصفر، والبرومبت الرئيسي الذي ستعطيه لـ Claude Code، ثم إعداد Supabase وGitHub وVercel حتى يصبح الموقع منشوراً على الإنترنت.

> **فكرة المشروع:** كتالوج إلكتروني للمحلات الصغيرة. يتصفح العميل المنتجات، يضيفها إلى السلة، ثم يرسل الطلب إلى صاحب المحل عبر واتساب. لا توجد بوابة دفع إلكتروني في النسخة الأولى.

---

## 1. ما الذي سنبنيه؟

### واجهة العميل

- صفحة رئيسية تحمل اسم المحل وشعاره ووصفاً مختصراً.
- عرض المنتجات بصورها وأسعارها.
- تصنيف المنتجات حسب الأقسام.
- البحث عن منتج بالاسم.
- صفحة أو نافذة لتفاصيل المنتج.
- إضافة المنتجات إلى سلة المشتريات.
- زيادة الكمية أو تقليلها أو حذف المنتج من السلة.
- إدخال اسم العميل ورقم هاتفه اختيارياً وملاحظات الطلب.
- زر **اطلب عبر واتساب** يفتح محادثة مع المحل برسالة جاهزة تتضمن المنتجات والكميات والأسعار والإجمالي.
- تصميم متجاوب يعمل على الهاتف والكمبيوتر.

### لوحة تحكم صاحب المحل

- تسجيل دخول آمن للمدير.
- إضافة المنتجات وتعديلها وحذفها.
- رفع صور المنتجات.
- إنشاء الأقسام وتعديلها وحذفها.
- إظهار المنتج أو إخفاؤه من المتجر.
- تعديل اسم المحل ووصفه وشعاره.
- تحديد رقم واتساب لاستقبال الطلبات.
- تحديد العملة ولون الواجهة.
- معاينة المتجر بعد التعديلات.

### ما لن نبنيه الآن

لا تضف بوابة دفع، أو نظام توصيل، أو تتبع شحنات، أو حسابات للعملاء، أو إدارة مخزون معقدة. الهدف إصدار أول بسيط يمكن عرضه وبيعه للمحلات.

---

## 2. التقنيات المستخدمة

| التقنية | الاستخدام |
|---|---|
| Next.js + TypeScript | بناء الموقع |
| Tailwind CSS | تصميم الواجهات |
| Supabase | قاعدة البيانات وتسجيل دخول المدير وتخزين الصور |
| GitHub | حفظ الكود وإدارة الإصدارات |
| Vercel | نشر الموقع على الإنترنت |

استخدم إصدارات مستقرة ومتوافقة من الحزم وقت إنشاء المشروع، ولا تثبّت مكتبات غير ضرورية.

---

## 3. تجهيز جهازك

تأكد من تثبيت:

1. Node.js إصدار LTS.
2. npm.
3. Git.
4. Claude Code.
5. محرر أكواد مثل VS Code.
6. حساب GitHub.
7. حساب Supabase.
8. حساب Vercel.

افتح Terminal ونفّذ:

```bash
node -v
npm -v
git --version
claude --version
```

إذا ظهر أن أحد الأوامر غير معروف، ثبّت الأداة أولاً ولا تنتقل للخطوة التالية قبل حل المشكلة.

---

## 4. إنشاء مشروع Next.js

من Terminal انتقل إلى المجلد الذي تحفظ فيه مشاريعك، ثم نفّذ:

```bash
npx create-next-app@latest whatsapp-catalog
```

عند ظهور أسئلة الإعداد، اختر:

- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: اقبل القيمة الافتراضية `@/*`

بعد انتهاء الإنشاء:

```bash
cd whatsapp-catalog
claude
```

سيبدأ Claude Code داخل مجلد المشروع. أعطه البرومبت الموجود في القسم التالي كاملاً.

---

## 5. البرومبت الرئيسي — انسخه إلى Claude Code

انسخ النص التالي كاملاً وأرسله إلى Claude Code:

```text
You are a senior full-stack engineer and product designer. Build a polished, secure, reusable, mobile-first product catalog website for small shops.

PROJECT GOAL
Customers browse a shop's products, add products to a cart, enter their name and optional order notes, and send the order to the shop through WhatsApp. The website does not process payments. WhatsApp is the final ordering channel.

Build two parts:
1. A public storefront for customers.
2. A secure admin dashboard for the shop owner.

TECH STACK
- Use the existing Next.js App Router project and TypeScript.
- Use Tailwind CSS.
- Use Supabase PostgreSQL for persistent data.
- Use Supabase Auth for admin authentication.
- Use Supabase Storage for product and shop images.
- Prepare the application for deployment to Vercel.
- Use a maintained icon library such as lucide-react if icons are needed.
- Use Zod for validation if useful.
- Use current stable compatible package versions.
- Avoid unnecessary dependencies.
- Use strict TypeScript and avoid `any`.

PUBLIC ROUTES
Create:
- `/` — public storefront.
- `/products/[id]` — product detail page if appropriate.
- `/admin/login` — admin login.
- `/admin` — protected dashboard overview.
- `/admin/products` — product management.
- `/admin/categories` — category management.
- `/admin/settings` — shop settings.

STOREFRONT
The home page must display:
- Shop logo and shop name.
- Shop description.
- Product search.
- Category filters.
- Responsive product grid.
- Product image, name, price, short description, and availability.
- Cart icon with item count.
- Clear add-to-cart actions.

CART
- Add products to cart.
- Increase and decrease quantities.
- Remove products.
- Display subtotal and total.
- Persist the cart locally between refreshes where practical.
- Prevent unavailable products from being added.
- Handle an empty cart clearly.
- Re-check current product availability and prices before generating the WhatsApp message.

CHECKOUT
Ask for:
- Customer name (required).
- Customer phone number (optional).
- Order note (optional).

WHATSAPP ORDERING
- Store the shop WhatsApp number in settings in international format, digits only, without plus sign, spaces, or punctuation. Example: `60123456789`.
- Generate a URL using `https://wa.me/{number}?text={encodedMessage}`.
- Encode the message safely.
- Include shop name, customer name, optional customer phone, product names, quantities, unit prices, line totals, subtotal, and optional note.
- If the WhatsApp number is missing or invalid, show a clear message instead of generating a broken link.
- Do not claim the order is confirmed or paid. Explain that the customer must send the WhatsApp message and the shop must confirm availability.

ADMIN AUTHENTICATION AND AUTHORIZATION
- Use Supabase Auth.
- Only explicitly authorized admin users may access admin pages or change data.
- Do not assume every authenticated user is an admin.
- Do not build public admin registration.
- Provide a safe, documented procedure for creating the first admin.
- Protect server actions and route handlers, not only the visual pages.
- Add logout.
- Never rely only on hiding admin buttons in the frontend.
- Never expose the Supabase service-role key in browser code.

DATABASE
Create SQL migration files or a clearly documented SQL setup script for these tables:

1. `shop_settings`
   - id
   - shop_name
   - description
   - logo_url
   - whatsapp_number
   - currency_code
   - accent_color
   - updated_at

2. `categories`
   - id
   - name
   - slug
   - sort_order
   - created_at
   - updated_at

3. `products`
   - id
   - category_id (nullable if uncategorized products are supported)
   - name
   - description
   - price
   - image_url
   - is_available
   - sort_order
   - created_at
   - updated_at

Use suitable primary keys, foreign keys, indexes, constraints, and timestamps.
Use a consistent ID strategy.
Store currency as an ISO currency code such as MYR or USD.
Use safe decimal handling for money; do not use imprecise floating-point calculations for financial totals.

SUPABASE SECURITY
- Enable Row Level Security (RLS) on every table exposed through the Supabase API.
- Public visitors may read only the public shop settings, categories, and available products.
- Only authorized admins may insert, update, or delete settings, categories, and products.
- Do not expose the service-role key in client components, public environment variables, or browser bundles.
- Perform authorization checks on the server for every admin mutation.
- Configure Storage policies so public visitors can view public product images while only authorized admins can upload, replace, or delete images.
- Include complete RLS policies and Storage setup instructions in the README.
- If an admin allowlist or role table is used, secure it so users cannot grant themselves admin privileges.

ADMIN DASHBOARD
Create a clean dashboard with:
- Overview cards for product count and category count.
- Product list with search and category filtering.
- Create, edit, publish/unpublish, and delete product actions.
- Product form fields: name, description, price, category, image, availability, and sort order.
- Image preview before saving.
- Image replacement support.
- Category create, edit, and delete actions.
- Shop settings form.
- Confirmation before destructive actions.
- Clear loading, validation, success, and error states.

SHOP SETTINGS
Allow the admin to update:
- Shop name.
- Shop description.
- Shop logo.
- WhatsApp number.
- Currency code.
- Accent color.

Explain the international digits-only WhatsApp format beside the input.

DESIGN
- Create a polished, trustworthy storefront suitable for small businesses.
- Mobile-first and fully responsive.
- Clear typography and visual hierarchy.
- Generous spacing and consistent design tokens.
- Attractive product cards with consistent image ratios.
- Easy-to-use cart on mobile.
- Accessible contrast, labels, and keyboard focus states.
- Simple admin sidebar on desktop and appropriate mobile navigation.
- No fake reviews, ratings, sales counters, or fabricated trust claims.
- Use the configured accent color without compromising readability.
- Add realistic demo content only when clearly marked as demo content.

CODE QUALITY
- Organize code into reusable components and clear modules.
- Validate all form inputs.
- Handle missing images and broken image URLs gracefully.
- Handle empty catalog and category states.
- Do not expose secrets or sensitive raw errors to users.
- Add useful comments only where they clarify non-obvious logic.
- Avoid duplicated business logic.
- Ensure the public catalog refreshes after admin changes.

TESTING
Test:
- Public users can view available products.
- Public users cannot create, update, or delete products.
- Unauthenticated users cannot access admin pages or mutate data.
- Authenticated non-admin users cannot perform admin actions.
- Authorized admins can create, edit, and delete products and categories.
- Image upload and replacement work.
- Cart add, quantity update, removal, and totals work.
- WhatsApp message includes correct product and customer details.
- Missing WhatsApp number is handled safely.
- Layout works on mobile and desktop.
- Linting and production build complete successfully.

DELIVERABLES
Provide:
1. Complete working source code.
2. SQL migration or setup files.
3. Supabase RLS and Storage setup instructions.
4. `.env.example` with placeholder values only.
5. Complete README with local setup and deployment instructions.
6. Safe first-admin setup instructions.
7. Manual testing checklist.
8. Final report of completed features, commands run, and known limitations.

WORKING METHOD
Work in phases and do not skip verification:
Phase 1: Inspect the existing project and give a concise implementation plan.
Phase 2: Build the visual storefront and reusable layout.
Phase 3: Implement database schema and Supabase integration.
Phase 4: Implement secure admin authentication and authorization.
Phase 5: Implement product, category, and settings management.
Phase 6: Implement cart and WhatsApp checkout.
Phase 7: Test, fix issues, and write documentation.

Before finishing:
- Run the lint command.
- Run the production build.
- Fix all errors.
- Tell me exactly which Supabase values I must configure.
- Do not invent credentials or claim deployment is complete before it is actually deployed.
- Do not put secrets in source code or commit them to Git.
```

---

## 6. دع Claude Code ينفّذ المشروع على مراحل

بعد إرسال البرومبت، لا تطلب منه تنفيذ كل شيء دفعة واحدة إذا بدأ يختصر أو يتجاوز خطوات مهمة.

استخدم هذه الرسائل بالترتيب عند الحاجة:

### المرحلة الأولى: التخطيط

```text
Start with Phase 1 only. Inspect the project, identify the required files and dependencies, and give me the implementation plan. Do not skip security or database design.
```

### المرحلة الثانية: واجهة المتجر

```text
Implement Phase 2 now. Build the complete responsive storefront UI using realistic demo data temporarily. Focus on polished mobile and desktop layouts. Do not connect Supabase yet. Run the checks and summarize the changes.
```

### المرحلة الثالثة: قاعدة البيانات

```text
Implement Phase 3. Create the Supabase database schema, migrations, typed database access, environment variable validation, and public catalog integration. Include secure RLS policies. Do not use a service-role key in browser code.
```

### المرحلة الرابعة: لوحة التحكم

```text
Implement Phase 4 and Phase 5. Add secure admin authentication and authorization, then product, category, image upload, and shop settings management. Verify that non-admin users cannot perform admin mutations.
```

### المرحلة الخامسة: السلة وواتساب

```text
Implement Phase 6. Finish the cart and WhatsApp checkout flow. Verify the generated WhatsApp message, URL encoding, quantities, prices, subtotal, customer name, and optional note. Handle missing or invalid shop WhatsApp settings safely.
```

### المرحلة السادسة: الاختبار النهائي

```text
Implement Phase 7. Run linting and a production build, fix all errors, inspect the responsive UI, verify authorization and RLS assumptions, and update the README with exact setup and deployment instructions. Do not claim tests passed unless you actually ran them.
```

---

## 7. إنشاء مشروع Supabase

1. افتح [Supabase](https://supabase.com/).
2. أنشئ حساباً أو سجّل الدخول.
3. أنشئ مشروعاً جديداً باسم `whatsapp-catalog`.
4. اختر كلمة مرور قوية لقاعدة البيانات واحفظها في مدير كلمات مرور.
5. اختر أقرب منطقة مناسبة لجمهور الموقع.
6. انتظر حتى يكتمل إنشاء المشروع.

### الحصول على مفاتيح الاتصال

من إعدادات مشروع Supabase افتح قسم API أو Connect حسب واجهة لوحة التحكم الحالية. ستحتاج عادةً إلى:

- Project URL.
- Publishable/anon key.

قد تختلف أسماء المفاتيح في واجهة Supabase. استخدم المفتاح العام المخصص للواجهة، ولا تستخدم secret أو service-role key في المتصفح.

### إعداد قاعدة البيانات

1. افتح SQL Editor في Supabase.
2. اطلب من Claude Code تحديد ملف SQL الذي أنشأه للمشروع.
3. انسخ محتوى ملف إعداد قاعدة البيانات أو migration المناسب.
4. نفّذه في SQL Editor.
5. راجع نتيجة التنفيذ وتأكد من عدم وجود أخطاء.
6. اتبع تعليمات المشروع لإنشاء Storage bucket وسياسات الوصول للصور.

**مهم:** لا تضع مفاتيح Supabase السرية داخل ملفات الكود أو GitHub. ولا تشاركها في المحادثات.

---

## 8. إعداد متغيرات البيئة محلياً

في مجلد المشروع، أنشئ ملفاً اسمه `.env.local` (إذا لم ينشئه Claude Code).

مثال توضيحي فقط — استبدل القيم بقيم مشروعك:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
```

إذا استخدم المشروع متغيرات إضافية، اتبع الأسماء التي يطلبها Claude Code في README. لا تخمّن أسماء متغيرات أخرى.

تأكد من أن `.env.local` موجود في `.gitignore`، ولا ترفعه إلى GitHub.

### تشغيل الموقع محلياً

```bash
npm run dev
```

افتح العنوان الذي يظهر في Terminal، وغالباً:

```text
http://localhost:3000
```

اختبر المتجر ولوحة التحكم قبل النشر. إذا ظهرت أخطاء، انسخ رسالة الخطأ إلى Claude Code واطلب منه إصلاح السبب، لا مجرد إخفاء الخطأ.

---

## 9. إنشاء أول مدير

اتبع إجراء إنشاء أول مدير الذي نفّذه Claude Code ودوّنه في README.

المبدأ الأمني المطلوب:
- أنشئ المستخدم من Supabase Auth.
- امنحه صلاحية المدير من إجراء آمن موثق، مثل allowlist أو إعداد إداري ينفذ من بيئة موثوقة.
- لا تسمح للمستخدمين بتسجيل أنفسهم كمدير.
- لا تضع service-role key في كود المتصفح.
- اختبر أن مستخدماً عادياً لا يستطيع تعديل المنتجات حتى لو حاول استدعاء API مباشرة.

لا تتابع النشر قبل التأكد من أن صلاحيات المدير تعمل بصورة صحيحة.

---

## 10. رفع المشروع إلى GitHub

أنشئ مستودعاً جديداً على [GitHub](https://github.com/):

1. اضغط New repository.
2. سمّه `whatsapp-catalog`.
3. اجعله Private في البداية إذا كنت لا تريد نشر الكود.
4. لا تضف ملفات المشروع تلقائياً من GitHub إذا كان المشروع موجوداً محلياً.
5. انسخ رابط المستودع.

ثم من Terminal داخل مجلد المشروع نفّذ:

```bash
git init
git add .
git status
```

**راجع ناتج `git status` قبل الالتزام.** تأكد من عدم ظهور `.env.local` أو أي ملف يحتوي أسراراً.

ثم:

```bash
git commit -m "Initial WhatsApp catalog"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

استبدل `YOUR_GITHUB_REPOSITORY_URL` برابط المستودع الحقيقي.

إذا كان Git مضبوطاً مسبقاً أو كان هناك remote موجود، لا تكرر `git init` أو `git remote add` عشوائياً. افحص الوضع أولاً:

```bash
git status
git remote -v
```

---

## 11. نشر الموقع على Vercel

1. افتح [Vercel](https://vercel.com/).
2. سجّل الدخول باستخدام GitHub.
3. اختر **Add New → Project**.
4. استورد مستودع `whatsapp-catalog`.
5. اترك إعدادات Next.js الافتراضية ما لم يطلب README خلاف ذلك.
6. افتح **Environment Variables**.
7. أضف متغيرات البيئة المطلوبة كما هي في `.env.local` وREADME.
8. لا تضف مفاتيح سرية إلى متغيرات تبدأ بـ `NEXT_PUBLIC_`.
9. اضغط Deploy.
10. انتظر انتهاء عملية البناء.

بعد النشر افتح رابط Vercel واختبر:
- الصفحة الرئيسية.
- عرض المنتجات.
- البحث والتصنيفات.
- السلة.
- إنشاء رسالة واتساب.
- تسجيل دخول المدير.
- إضافة وتعديل منتج.
- رفع صورة.
- تعديل إعدادات المحل.

إذا فشل النشر، افتح Build Logs وانسخ الخطأ كاملاً إلى Claude Code ليعالجه.

---

## 12. ربط التحديثات المستقبلية

بعد ربط GitHub بـ Vercel، كل مرة تنتهي فيها من تعديل وتريد نشره:

```bash
git add .
git status
git commit -m "Describe your changes"
git push
```

سيكتشف Vercel التحديث وينفّذ عملية نشر جديدة تلقائياً.

لا تنفّذ `git add .` قبل مراجعة `git status` والتأكد من عدم إضافة ملفات أسرار أو ملفات غير مقصودة.

---

## 13. قائمة فحص قبل تسليم الموقع لمحل

- [ ] اسم المحل وشعاره صحيحان.
- [ ] رقم واتساب صحيح بصيغة دولية، أرقام فقط.
- [ ] العملة صحيحة.
- [ ] المنتجات وأسعارها وصورها صحيحة.
- [ ] الأقسام تعمل.
- [ ] المنتجات غير المتاحة لا يمكن طلبها.
- [ ] السلة تحسب الكميات والإجمالي بشكل صحيح.
- [ ] رسالة واتساب تعرض الطلب بوضوح.
- [ ] لا توجد بوابة دفع أو ادعاءات دفع غير موجودة.
- [ ] المدير يستطيع إدارة المنتجات والأقسام.
- [ ] المستخدم غير المصرح له لا يستطيع دخول لوحة التحكم أو تعديل البيانات.
- [ ] مفاتيح السر غير موجودة في GitHub.
- [ ] الموقع يعمل على الهاتف والكمبيوتر.
- [ ] تم اختبار رابط الموقع المنشور فعلياً.

---

## 14. كيف تحوّل المشروع إلى منتج قابل للبيع؟

لا تبع نسخة تجريبية قبل اختبارها مع محل حقيقي. ابدأ بمحل واحد، وأدخل منتجاته بنفسك، وراقب أين يتعثر صاحب المحل أو العميل.

يمكنك تقديم الخدمة على أنها:
- إنشاء كتالوج إلكتروني باسم المحل.
- إضافة المنتجات والصور والأسعار.
- استقبال الطلبات عبر واتساب.
- لوحة تحكم لتحديث المنتجات.
- إعداد الدومين والاستضافة.

يمكنك لاحقاً تحديد رسوم إنشاء ورسوم صيانة، لكن لا تعد العميل بميزات لم تنفذها، ولا تعتبر الطلب المرسل إلى واتساب طلباً مؤكداً تلقائياً.

### تطويرات مستقبلية — لا تضفها في الإصدار الأول

- دعم عدة متاجر من لوحة تحكم واحدة (Multi-tenant).
- لغات متعددة.
- تقارير الطلبات.
- كوبونات خصم.
- خيارات وأحجام للمنتجات.
- تكامل توصيل أو دفع إلكتروني.

**نصيحة أخيرة:** أنجز نسخة واحدة لمتجر واحد أولاً. تأكد من أن إعداد متجر جديد لا يتطلب تعديل الكود يدوياً في أماكن كثيرة. بعد نجاح التجربة الأولى، قرر هل تطور النظام إلى منصة متعددة المتاجر أم تبيع نسخاً مخصصة لكل محل.
