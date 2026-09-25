import os
import math
import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

def ar(text):
    if not text:
        return ""
    return get_display(arabic_reshaper.reshape(text))

FONT_KUFI_BOLD = '/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf'
FONT_KUFI_REG = '/usr/share/fonts/truetype/noto/NotoKufiArabic-Regular.ttf'
FONT_SANS_BOLD = '/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf'
FONT_SANS_REG = '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf'

def create_phone_frame(width=840, height=1720, is_dark=False):
    """Creates a sleek, modern smartphone mockup frame with rounded screen."""
    frame = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(frame)
    
    # Outer device bezel
    bezel_color = (30, 41, 59, 255) if is_dark else (226, 232, 240, 255)
    fdraw.rounded_rectangle([0, 0, width-1, height-1], radius=54, fill=(15, 23, 42) if is_dark else (248, 250, 252), outline=bezel_color, width=4)
    
    # Inner screen
    bg_color = (13, 14, 16) if is_dark else (250, 249, 246)
    fdraw.rounded_rectangle([16, 16, width-17, height-17], radius=44, fill=bg_color)
    
    # Top dynamic island / camera punch hole
    fdraw.rounded_rectangle([width//2 - 60, 28, width//2 + 60, 56], radius=14, fill=(0, 0, 0, 220))
    
    return frame

def draw_header_title(draw, canvas_w, title, subtitle):
    font_title = ImageFont.truetype(FONT_KUFI_BOLD, 54)
    font_sub = ImageFont.truetype(FONT_KUFI_REG, 30)
    
    t_text = ar(title)
    s_text = ar(subtitle)
    
    draw.text((canvas_w // 2, 130), t_text, font=font_title, fill='#FFFFFF', anchor='mm')
    draw.text((canvas_w // 2, 205), s_text, font=font_sub, fill='#A7F3D0', anchor='mm')

def build_screenshot_1_home():
    """Screenshot 1: Home screen with habit progress, date strip, and habit list."""
    W, H = 1080, 2400
    canvas = Image.new('RGB', (W, H), '#182C22')
    draw = ImageDraw.Draw(canvas)
    
    # Background gradient
    for y in range(H):
        ratio = y / H
        r = int(24 + (16 - 24) * ratio)
        g = int(48 + (34 - 48) * ratio)
        b = int(36 + (26 - 36) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
        
    draw_header_title(draw, W, "تتبع عاداتك اليومية بسلاسة", "واجهة هادئة، إنجازات يومية، وسلاسل مستمرة")
    
    # Phone frame
    frame = create_phone_frame(880, 1920, is_dark=False)
    fdraw = ImageDraw.Draw(frame)
    
    font_ui_bold = ImageFont.truetype(FONT_KUFI_BOLD, 28)
    font_ui_med = ImageFont.truetype(FONT_SANS_BOLD, 22)
    font_ui_reg = ImageFont.truetype(FONT_SANS_REG, 18)
    
    # Top In-app Bar
    fdraw.text((820, 95), ar("اليوم • الإنجاز"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    fdraw.rounded_rectangle([60, 80, 160, 115], radius=18, fill='#EBF2EE', outline='#2A4B3A', width=1)
    fdraw.text((110, 97), ar("٥ من ٥"), font=font_ui_med, fill='#2A4B3A', anchor='mm')
    
    # Date Strip Capsules
    days = [("السبت", "١٩"), ("الأحد", "٢٠"), ("الإثنين", "٢١"), ("الثلاثاء", "٢٢"), ("الأربعاء", "٢٣"), ("اليوم", "٢٤"), ("الجمعة", "٢٥")]
    capsule_w = 95
    start_x = 780
    for i, (day_name, day_num) in enumerate(days):
        x = start_x - (i * 105)
        is_today = (i == 5)
        bg = '#2A4B3A' if is_today else '#FFFFFF'
        txt_c = '#FFFFFF' if is_today else '#57534E'
        border_c = '#2A4B3A' if is_today else '#E2E8F0'
        
        fdraw.rounded_rectangle([x, 140, x + capsule_w, 230], radius=16, fill=bg, outline=border_c, width=1)
        fdraw.text((x + capsule_w//2, 165), ar(day_name), font=font_ui_reg, fill=txt_c, anchor='mm')
        fdraw.text((x + capsule_w//2, 200), ar(day_num), font=font_ui_med, fill=txt_c, anchor='mm')
    
    # Daily Progress Card
    fdraw.rounded_rectangle([50, 260, 830, 430], radius=24, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((790, 310), ar("معدل إنجاز اليوم"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    fdraw.text((790, 355), ar("أنجزت جميع عاداتك اليوم بنجاح! أحسنت الاستمرار."), font=font_ui_reg, fill='#57534E', anchor='rm')
    
    # Progress ring graphic
    fdraw.ellipse([90, 290, 210, 410], outline='#EBF2EE', width=14)
    fdraw.arc([90, 290, 210, 410], start=-90, end=270, fill='#2A4B3A', width=14)
    fdraw.text((150, 350), ar("١٠٠٪"), font=font_ui_bold, fill='#2A4B3A', anchor='mm')
    
    # Habit Cards
    habits = [
        ("شرب ٢ لتر ماء", "الحفاظ على رطوبة ونشاط الجسم", "٣٤ يوم متتالٍ", "#2A4B3A", True),
        ("قراءة في كتاب نافع", "٢٠ دقيقة من القراءة المتأنية", "١٢ يوم متتالٍ", "#1E3A8A", True),
        ("تمارين الصباح والإطالة", "٣٠ دقيقة من الحركة والتنشيط", "٨ أيام متتالية", "#854D0E", True),
        ("أذكار وتأمل هادئ", "بداية يوم مفعمة بالسكينة", "٤٥ يوم متتالٍ", "#0F766E", True),
        ("النوم المبكر (١١ مساءً)", "تنظيم ساعات النوم وجودة الراحة", "٥ أيام متتالية", "#581C87", True),
    ]
    
    card_y = 460
    for name, desc, streak, color, completed in habits:
        fdraw.rounded_rectangle([50, card_y, 830, card_y + 130], radius=20, fill='#FFFFFF', outline='#EBEAE5', width=1)
        
        # Checkbox Button (Left in RTL)
        fdraw.ellipse([80, card_y + 35, 140, card_y + 95], fill='#2A4B3A')
        fdraw.line([(98, card_y + 65), (107, card_y + 75), (124, card_y + 55)], fill='#FFFFFF', width=4)
        
        # Color bar on the right
        fdraw.rounded_rectangle([815, card_y + 20, 822, card_y + 110], radius=4, fill=color)
        
        # Habit Details
        fdraw.text((800, card_y + 45), ar(name), font=font_ui_bold, fill='#1C1917', anchor='rm')
        fdraw.text((800, card_y + 85), ar(desc), font=font_ui_reg, fill='#78716C', anchor='rm')
        
        # Streak pill
        fdraw.rounded_rectangle([200, card_y + 45, 340, card_y + 85], radius=12, fill='#EBF2EE')
        fdraw.text((270, card_y + 65), ar(streak), font=font_ui_reg, fill='#2A4B3A', anchor='mm')
        
        card_y += 150
        
    # Bottom Tab Bar
    fdraw.rounded_rectangle([16, 1780, 864, 1904], radius=0, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((700, 1840), ar("الرئيسية"), font=font_ui_bold, fill='#2A4B3A', anchor='mm')
    fdraw.text((440, 1840), ar("الإحصائيات"), font=font_ui_med, fill='#78716C', anchor='mm')
    fdraw.text((180, 1840), ar("الإعدادات"), font=font_ui_med, fill='#78716C', anchor='mm')
    
    canvas.paste(frame, (100, 320), frame)
    canvas.save('store_assets/screenshots/phone_1_home.png', 'PNG', optimize=True)
    print("Saved phone_1_home.png")

def build_screenshot_2_stats():
    """Screenshot 2: Statistics & Consistency Heatmap."""
    W, H = 1080, 2400
    canvas = Image.new('RGB', (W, H), '#182C22')
    draw = ImageDraw.Draw(canvas)
    
    for y in range(H):
        ratio = y / H
        r = int(24 + (16 - 24) * ratio)
        g = int(48 + (34 - 48) * ratio)
        b = int(36 + (26 - 36) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
        
    draw_header_title(draw, W, "إحصائيات دقيقة وتحليل الالتزام", "تعرّف على نمط أيامك وسلاسل تقدمك")
    
    frame = create_phone_frame(880, 1920, is_dark=False)
    fdraw = ImageDraw.Draw(frame)
    
    font_ui_bold = ImageFont.truetype(FONT_KUFI_BOLD, 28)
    font_ui_med = ImageFont.truetype(FONT_SANS_BOLD, 22)
    font_ui_reg = ImageFont.truetype(FONT_SANS_REG, 18)
    
    # In-app Header
    fdraw.text((820, 95), ar("لوحة الإحصائيات الشاملة"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    
    # 4 Overview Stat Cards
    stat_boxes = [
        ("أطول سلسلة", "٤٥ يومًا", "#2A4B3A", 470, 150),
        ("إجمالي الإنجازات", "٣٤٢ مرة", "#1E3A8A", 830, 150),
        ("نسبة الالتزام", "٩٢٪", "#0F766E", 470, 310),
        ("العادات النشطة", "٥ عادات", "#854D0E", 830, 310),
    ]
    for label, val, color, right_x, top_y in stat_boxes:
        fdraw.rounded_rectangle([right_x - 340, top_y, right_x, top_y + 130], radius=20, fill='#FFFFFF', outline='#EBEAE5', width=1)
        fdraw.text((right_x - 30, top_y + 40), ar(label), font=font_ui_reg, fill='#78716C', anchor='rm')
        fdraw.text((right_x - 30, top_y + 85), ar(val), font=font_ui_bold, fill=color, anchor='rm')
        
    # Weekly Adherence Bar Chart Card
    fdraw.rounded_rectangle([50, 470, 830, 860], radius=24, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((790, 520), ar("معدل الإنجاز خلال أيام الأسبوع"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    fdraw.text((790, 560), ar("نسبة التزامك بكل يوم على مدار الشهر"), font=font_ui_reg, fill='#78716C', anchor='rm')
    
    week_days = [("السبت", 88), ("الأحد", 94), ("الإثنين", 90), ("الثلاثاء", 96), ("الأربعاء", 85), ("الخميس", 80), ("الجمعة", 98)]
    chart_base_y = 780
    chart_start_x = 750
    for i, (day_name, pct) in enumerate(week_days):
        cx = chart_start_x - (i * 105)
        bar_h = int((pct / 100) * 160)
        bar_top = chart_base_y - bar_h
        
        # Bar track
        fdraw.rounded_rectangle([cx - 24, chart_base_y - 160, cx + 24, chart_base_y], radius=12, fill='#F4F3EF')
        # Filled bar
        fdraw.rounded_rectangle([cx - 24, bar_top, cx + 24, chart_base_y], radius=12, fill='#2A4B3A')
        # Percentage label
        fdraw.text((cx, bar_top - 20), ar(f"{pct}٪"), font=font_ui_reg, fill='#2A4B3A', anchor='mm')
        # Day label
        fdraw.text((cx, chart_base_y + 30), ar(day_name[:3]), font=font_ui_reg, fill='#57534E', anchor='mm')

    # Streak Milestones Card
    fdraw.rounded_rectangle([50, 890, 830, 1170], radius=24, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((790, 940), ar("أوسمة الإنجاز والاستمرارية"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    
    badges = [
        ("سلسلة ٣٠ يومًا", "وسام الالتزام الراسخ", "🏅"),
        ("سلسلة ٦٠ يومًا", "وسام الانضباط العالي", "⭐"),
        ("سلسلة ١٠٠ يوم", "وسام العادة الدائمة", "👑"),
    ]
    by = 1000
    for b_title, b_sub, emoji in badges:
        fdraw.rounded_rectangle([80, by, 800, by + 70], radius=16, fill='#EBF2EE')
        fdraw.text((770, by + 35), emoji, font=font_ui_bold, anchor='rm')
        fdraw.text((730, by + 25), ar(b_title), font=font_ui_bold, fill='#2A4B3A', anchor='rm')
        fdraw.text((730, by + 50), ar(b_sub), font=font_ui_reg, fill='#57534E', anchor='rm')
        fdraw.text((120, by + 35), ar("مكتمل ✓"), font=font_ui_bold, fill='#2A4B3A', anchor='lm')
        by += 85
        
    canvas.paste(frame, (100, 320), frame)
    canvas.save('store_assets/screenshots/phone_2_statistics.png', 'PNG', optimize=True)
    print("Saved phone_2_statistics.png")

def build_screenshot_3_customization():
    """Screenshot 3: Flexible Habits Customization & Reminders."""
    W, H = 1080, 2400
    canvas = Image.new('RGB', (W, H), '#182C22')
    draw = ImageDraw.Draw(canvas)
    
    for y in range(H):
        ratio = y / H
        r = int(24 + (16 - 24) * ratio)
        g = int(48 + (34 - 48) * ratio)
        b = int(36 + (26 - 36) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
        
    draw_header_title(draw, W, "مرونة كاملة في تحديد أهدافك", "يومية، أسبوعية، شهرية، أو أهداف كمية مقاسة")
    
    frame = create_phone_frame(880, 1920, is_dark=False)
    fdraw = ImageDraw.Draw(frame)
    
    font_ui_bold = ImageFont.truetype(FONT_KUFI_BOLD, 28)
    font_ui_med = ImageFont.truetype(FONT_SANS_BOLD, 22)
    font_ui_reg = ImageFont.truetype(FONT_SANS_REG, 18)
    
    fdraw.text((820, 95), ar("إنشاء وتخصيص عادة جديدة"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    
    # Form fields
    # Field 1: Name
    fdraw.text((800, 160), ar("اسم العادة"), font=font_ui_med, fill='#1C1917', anchor='rm')
    fdraw.rounded_rectangle([80, 190, 800, 260], radius=16, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((770, 225), ar("قراءة كتاب نافع"), font=font_ui_bold, fill='#1C1917', anchor='rm')
    
    # Field 2: Target Type Pills (Daily / Weekly / Monthly / Quantitative)
    fdraw.text((800, 290), ar("نوع الهدف والتكرار"), font=font_ui_med, fill='#1C1917', anchor='rm')
    types = [("هدف يومي", True), ("أيام محددة", False), ("هدف أسبوعي مرن", False)]
    tx = 770
    for t_name, is_sel in types:
        tw = 210
        t_bg = '#2A4B3A' if is_sel else '#FFFFFF'
        t_txt = '#FFFFFF' if is_sel else '#57534E'
        fdraw.rounded_rectangle([tx - tw, 320, tx, 380], radius=16, fill=t_bg, outline='#2A4B3A' if is_sel else '#EBEAE5', width=1)
        fdraw.text((tx - tw//2, 350), ar(t_name), font=font_ui_med, fill=t_txt, anchor='mm')
        tx -= (tw + 20)
        
    # Field 3: Quantitative Target & Unit
    fdraw.text((800, 420), ar("الهدف اليومي والوحدة"), font=font_ui_med, fill='#1C1917', anchor='rm')
    fdraw.rounded_rectangle([460, 450, 800, 520], radius=16, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((630, 485), ar("٢٠ صفحة"), font=font_ui_bold, fill='#2A4B3A', anchor='mm')
    
    fdraw.rounded_rectangle([80, 450, 420, 520], radius=16, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((250, 485), ar("تعديل الوحدة: صفحة"), font=font_ui_med, fill='#57534E', anchor='mm')
    
    # Field 4: Reminder Time Clock Picker
    fdraw.text((800, 560), ar("التذكير الذكي"), font=font_ui_med, fill='#1C1917', anchor='rm')
    fdraw.rounded_rectangle([80, 590, 800, 670], radius=16, fill='#FFFFFF', outline='#EBEAE5', width=1)
    fdraw.text((770, 630), ar("⏰ ٠٩:٣٠ مساءً"), font=font_ui_bold, fill='#2A4B3A', anchor='rm')
    fdraw.text((120, 630), ar("مفعل ✓"), font=font_ui_med, fill='#2A4B3A', anchor='lm')
    
    # Field 5: Colors Palette
    fdraw.text((800, 710), ar("لون العادة"), font=font_ui_med, fill='#1C1917', anchor='rm')
    colors = ['#2A4B3A', '#1E3A8A', '#854D0E', '#0F766E', '#581C87', '#991B1B']
    cx = 760
    for i, col in enumerate(colors):
        fdraw.ellipse([cx - 50, 740, cx, 790], fill=col)
        if i == 0:
            fdraw.ellipse([cx - 56, 734, cx + 6, 796], outline='#2A4B3A', width=3)
        cx -= 75
        
    # Save Action Button
    fdraw.rounded_rectangle([80, 840, 800, 920], radius=20, fill='#2A4B3A')
    fdraw.text((440, 880), ar("حفظ العادة"), font=font_ui_bold, fill='#FFFFFF', anchor='mm')
    
    canvas.paste(frame, (100, 320), frame)
    canvas.save('store_assets/screenshots/phone_3_add_habit.png', 'PNG', optimize=True)
    print("Saved phone_3_add_habit.png")

def build_screenshot_4_privacy():
    """Screenshot 4: 100% Offline, Privacy-First, No Ads & Dark Mode."""
    W, H = 1080, 2400
    canvas = Image.new('RGB', (W, H), '#182C22')
    draw = ImageDraw.Draw(canvas)
    
    for y in range(H):
        ratio = y / H
        r = int(24 + (16 - 24) * ratio)
        g = int(48 + (34 - 48) * ratio)
        b = int(36 + (26 - 36) * ratio)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
        
    draw_header_title(draw, W, "خصوصية مطلقة • بياناتك في يدك", "١٠٠٪ محلي، بدون إنترنت، وبدون أي إعلانات أو تتبع")
    
    # Dark Mode Phone Frame
    frame = create_phone_frame(880, 1920, is_dark=True)
    fdraw = ImageDraw.Draw(frame)
    
    font_ui_bold = ImageFont.truetype(FONT_KUFI_BOLD, 28)
    font_ui_med = ImageFont.truetype(FONT_SANS_BOLD, 22)
    font_ui_reg = ImageFont.truetype(FONT_SANS_REG, 18)
    
    fdraw.text((820, 95), ar("الإعدادات وأمان البيانات"), font=font_ui_bold, fill='#F8FAFC', anchor='rm')
    
    # Privacy Hero Card
    fdraw.rounded_rectangle([50, 150, 830, 420], radius=24, fill='#16181B', outline='#262A30', width=1)
    fdraw.ellipse([730, 190, 800, 260], fill=(16, 185, 129, 45))
    fdraw.text((765, 225), "🛡️", font=font_ui_bold, anchor='mm')
    
    fdraw.text((700, 225), ar("الخصوصية أولاً (Privacy-First)"), font=font_ui_bold, fill='#10B981', anchor='rm')
    fdraw.text((790, 290), ar("بياناتك وعاداتك وملاحظاتك محفوظة بالكامل داخل جهازك في"), font=font_ui_reg, fill='#CBD5E1', anchor='rm')
    fdraw.text((790, 325), ar("قاعدة بيانات معزولة. لا توجد خوادم سحابية ولا يتم رفع أي شيء."), font=font_ui_reg, fill='#CBD5E1', anchor='rm')
    
    # 3 Pillar Badges
    pillars = [
        ("خالٍ تماماً من الإعلانات", "0% Ads / Trackers", "🚫"),
        ("بدون إنشاء حساب", "لا نطلب بريدك أو هاتفك", "👤"),
        ("نسخ احتياطي فوري", "تصدير JSON وجداول CSV", "💾"),
    ]
    py = 460
    for p_title, p_desc, p_icon in pillars:
        fdraw.rounded_rectangle([50, py, 830, py + 120], radius=20, fill='#16181B', outline='#262A30', width=1)
        fdraw.text((780, py + 60), p_icon, font=font_ui_bold, anchor='rm')
        fdraw.text((730, py + 40), ar(p_title), font=font_ui_bold, fill='#F8FAFC', anchor='rm')
        fdraw.text((730, py + 75), ar(p_desc), font=font_ui_reg, fill='#94A3B8', anchor='rm')
        py += 140
        
    # Export / Data Sovereignty Section
    fdraw.rounded_rectangle([50, py, 830, py + 260], radius=20, fill='#16181B', outline='#262A30', width=1)
    fdraw.text((790, py + 40), ar("التحكم الكامل وتصدير البيانات"), font=font_ui_bold, fill='#F8FAFC', anchor='rm')
    
    # Export JSON Button
    fdraw.rounded_rectangle([450, py + 80, 800, py + 150], radius=16, fill='#202327', outline='#262A30', width=1)
    fdraw.text((625, py + 115), ar("تصدير نسخة JSON"), font=font_ui_med, fill='#10B981', anchor='mm')
    
    # Export CSV Button
    fdraw.rounded_rectangle([80, py + 80, 420, py + 150], radius=16, fill='#202327', outline='#262A30', width=1)
    fdraw.text((250, py + 115), ar("تصدير تقرير Excel / CSV"), font=font_ui_med, fill='#10B981', anchor='mm')
    
    # Delete All Data
    fdraw.rounded_rectangle([80, py + 175, 800, py + 235], radius=16, fill=(59, 18, 18), outline=(239, 68, 68), width=1)
    fdraw.text((440, py + 205), ar("مسح كافة البيانات نهائياً من الجهاز"), font=font_ui_med, fill='#EF4444', anchor='mm')

    canvas.paste(frame, (100, 320), frame)
    canvas.save('store_assets/screenshots/phone_4_privacy_offline.png', 'PNG', optimize=True)
    print("Saved phone_4_privacy_offline.png")

def build_tablet_screenshots():
    """Generates 2 tablet screenshots (1600 x 2560)."""
    for idx, (title, sub) in enumerate([
        ("تطبيق إنجاز على الأجهزة اللوحية", "واجهة رحبة ومريحة لمتابعة عاداتك وإحصائياتك على الشاشات الكبيرة"),
        ("إحصائيات متكاملة ورؤية سنوية شاملة", "تنظيم متوازن بين عاداتك اليومية والأسبوعية والشهرية"),
    ]):
        W, H = 1600, 2560
        canvas = Image.new('RGB', (W, H), '#182C22')
        draw = ImageDraw.Draw(canvas)
        
        for y in range(H):
            ratio = y / H
            r = int(24 + (16 - 24) * ratio)
            g = int(48 + (34 - 48) * ratio)
            b = int(36 + (26 - 36) * ratio)
            draw.line([(0, y), (W, y)], fill=(r, g, b))
            
        font_title = ImageFont.truetype(FONT_KUFI_BOLD, 64)
        font_sub = ImageFont.truetype(FONT_KUFI_REG, 36)
        draw.text((W // 2, 140), ar(title), font=font_title, fill='#FFFFFF', anchor='mm')
        draw.text((W // 2, 220), ar(sub), font=font_sub, fill='#A7F3D0', anchor='mm')
        
        # Tablet device frame (width 1360, height 2100)
        t_frame = Image.new('RGBA', (1360, 2100), (0, 0, 0, 0))
        tdraw = ImageDraw.Draw(t_frame)
        tdraw.rounded_rectangle([0, 0, 1359, 2099], radius=60, fill=(248, 250, 252), outline=(226, 232, 240), width=6)
        tdraw.rounded_rectangle([20, 20, 1339, 2079], radius=48, fill=(250, 249, 246))
        
        # Camera
        tdraw.ellipse([670, 35, 690, 55], fill=(0, 0, 0, 180))
        
        # Tablet split-content mockup
        font_ui_bold = ImageFont.truetype(FONT_KUFI_BOLD, 36)
        font_ui_med = ImageFont.truetype(FONT_SANS_BOLD, 26)
        font_ui_reg = ImageFont.truetype(FONT_SANS_REG, 22)
        
        # Top bar
        tdraw.text((1280, 110), ar("إنجاز • رفيقك اليومي للنمو والانضباط"), font=font_ui_bold, fill='#1C1917', anchor='rm')
        
        # Left pane: Habit cards
        # Right pane: Stats & Calendar
        tdraw.rounded_rectangle([720, 180, 1300, 1000], radius=24, fill='#FFFFFF', outline='#EBEAE5', width=1)
        tdraw.text((1260, 230), ar("عادات اليوم (الخميس ٢٤ سبتمبر)"), font=font_ui_bold, fill='#1C1917', anchor='rm')
        
        habits = ["شرب ٢ لتر ماء", "قراءة ٢٠ صفحة من كتاب", "تمارين الصباح والإطالة", "أذكار وتأمل هادئ"]
        hy = 310
        for h in habits:
            tdraw.rounded_rectangle([760, hy, 1260, hy + 130], radius=18, fill='#F4F3EF')
            tdraw.ellipse([790, hy + 35, 850, hy + 95], fill='#2A4B3A')
            tdraw.line([(808, hy + 65), (817, hy + 75), (834, hy + 55)], fill='#FFFFFF', width=4)
            tdraw.text((1230, hy + 65), ar(h), font=font_ui_bold, fill='#1C1917', anchor='rm')
            hy += 160
            
        # Left Pane: Consistency & Monthly Progress
        tdraw.rounded_rectangle([60, 180, 680, 1000], radius=24, fill='#FFFFFF', outline='#EBEAE5', width=1)
        tdraw.text((640, 230), ar("نظرة عامة على الالتزام"), font=font_ui_bold, fill='#1C1917', anchor='rm')
        
        # Progress donut
        tdraw.ellipse([210, 340, 530, 660], outline='#EBF2EE', width=32)
        tdraw.arc([210, 340, 530, 660], start=-90, end=240, fill='#2A4B3A', width=32)
        tdraw.text((370, 500), ar("٩٢٪"), font=font_ui_bold, fill='#2A4B3A', anchor='mm')
        
        canvas.paste(t_frame, (120, 320), t_frame)
        canvas.save(f'store_assets/screenshots/tablet_{idx+1}.png', 'PNG', optimize=True)
        print(f"Saved tablet_{idx+1}.png")

if __name__ == '__main__':
    build_screenshot_1_home()
    build_screenshot_2_stats()
    build_screenshot_3_customization()
    build_screenshot_4_privacy()
    build_tablet_screenshots()
    print("All store screenshots generated successfully!")
