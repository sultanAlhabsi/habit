import os
import subprocess
import base64

CHROME_BIN = '/usr/bin/google-chrome'
USER_DATA_DIR = '/tmp/chrome-store-assets'
OUTPUT_DIR = '/home/sultan/Documents/projects/habit/store_assets'
SCREENSHOTS_DIR = os.path.join(OUTPUT_DIR, 'screenshots')

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
os.makedirs(USER_DATA_DIR, exist_ok=True)

# Encode icon to base64
icon_path = os.path.join(OUTPUT_DIR, 'icon_512x512.png')
with open(icon_path, 'rb') as f:
    ICON_B64 = base64.b64encode(f.read()).decode('utf-8')

COMMON_CSS = """
  @font-face {
    font-family: 'Noto Kufi Arabic';
    src: url('file:///usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf') format('truetype');
    font-weight: 700;
  }
  @font-face {
    font-family: 'Noto Kufi Arabic';
    src: url('file:///usr/share/fonts/truetype/noto/NotoKufiArabic-Regular.ttf') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Noto Sans Arabic';
    src: url('file:///usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf') format('truetype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Noto Sans Arabic';
    src: url('file:///usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf') format('truetype');
    font-weight: 700;
  }

  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; margin: 0; padding: 0; }
"""

def render_chrome(html_content, output_path, width, height):
    temp_html = f'/tmp/render_{os.path.basename(output_path)}.html'
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    cmd = [
        CHROME_BIN,
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        f'--user-data-dir={USER_DATA_DIR}',
        '--hide-scrollbars',
        f'--window-size={width},{height}',
        f'--screenshot={output_path}',
        f'file://{temp_html}'
    ]
    subprocess.run(cmd, check=True)
    print(f"✅ Generated: {output_path} ({width}x{height})")


# ==============================================================================
# 1. FEATURE GRAPHIC (1024 x 500)
# ==============================================================================
def generate_feature_graphic():
    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<style>
  {COMMON_CSS}
  body {{
    width: 1024px;
    height: 500px;
    background: radial-gradient(circle at 75% 50%, #1d4631 0%, #0d2217 50%, #06110b 100%);
    font-family: 'Noto Sans Arabic', sans-serif;
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 55px;
  }}

  .glow-circle {{
    position: absolute;
    width: 650px;
    height: 650px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%);
    top: -80px;
    right: 20px;
    pointer-events: none;
  }}

  .content-side {{
    max-width: 550px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }}

  .logo-row {{
    display: flex;
    align-items: center;
    gap: 16px;
  }}

  .logo-img {{
    width: 72px;
    height: 72px;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 20px rgba(52, 211, 153, 0.3);
  }}

  .brand-badge {{
    display: inline-block;
    padding: 6px 16px;
    background: rgba(16, 185, 129, 0.18);
    border: 1px solid rgba(52, 211, 153, 0.4);
    border-radius: 999px;
    color: #34D399;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Noto Kufi Arabic', sans-serif;
  }}

  .main-title {{
    font-family: 'Noto Kufi Arabic', sans-serif;
    font-size: 46px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.25;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }}

  .main-desc {{
    font-size: 20px;
    color: #A7F3D0;
    line-height: 1.5;
    font-weight: 400;
  }}

  .features-list {{
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
  }}

  .feature-pill {{
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 8px 18px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 600;
    color: #E2E8F0;
    width: fit-content;
    backdrop-filter: blur(8px);
  }}

  .feature-pill .check-icon {{
    color: #10B981;
    font-size: 18px;
  }}

  /* Phone Mockup */
  .mockup-container {{
    position: relative;
    z-index: 10;
    width: 360px;
    height: 480px;
    display: flex;
    align-items: flex-end;
  }}

  .angled-phone {{
    width: 330px;
    height: 520px;
    background: #181E1B;
    border-radius: 40px 40px 0 0;
    padding: 10px 10px 0 10px;
    box-shadow: -20px 20px 50px rgba(0,0,0,0.7), 0 0 0 2px rgba(255,255,255,0.1), 0 0 40px rgba(16,185,129,0.25);
    transform: rotate(-5deg) translateY(35px);
    overflow: hidden;
  }}

  .screen-inner {{
    width: 100%;
    height: 100%;
    background: #FAF9F6;
    border-radius: 32px 32px 0 0;
    padding: 16px;
    color: #1C1917;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }}

  .phone-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'Noto Kufi Arabic', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #1C1917;
  }}

  .mock-card {{
    background: #FFFFFF;
    border-radius: 16px;
    padding: 12px 14px;
    border: 1px solid #EBEAE5;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}

  .mock-progress {{
    background: #FFFFFF;
    border-radius: 16px;
    padding: 12px 14px;
    border: 1px solid #EBEAE5;
  }}
  .progress-bar-wrap {{
    height: 8px;
    background: #EBF2EE;
    border-radius: 99px;
    margin-top: 8px;
    overflow: hidden;
  }}
  .progress-bar-inner {{
    width: 80%;
    height: 100%;
    background: #10B981;
  }}

  .badge-completed {{
    width: 28px;
    height: 28px;
    background: #2A4B3A;
    color: #fff;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }}
</style>
</head>
<body>
  <div class="glow-circle"></div>

  <div class="content-side">
    <div class="logo-row">
      <img src="data:image/png;base64,{ICON_B64}" class="logo-img" alt="Enjaz Logo">
      <div>
        <span class="brand-badge">✦ محلي بالكامل ✦</span>
      </div>
    </div>

    <h1 class="main-title">إنجاز: تتبع عاداتك اليومية</h1>
    <p class="main-desc">ابنِ عاداتك بهدوء وخصوصية تامة، محلي 100% وبدون أي إعلانات أو تسجيل.</p>

    <div class="features-list">
      <div class="feature-pill">
        <span class="check-icon">✔</span>
        <span>تخزين محلي 100% وبدون خوادم سحابية</span>
      </div>
      <div class="feature-pill">
        <span class="check-icon">✔</span>
        <span>خالٍ تماماً من الإعلانات والتتبع</span>
      </div>
      <div class="feature-pill">
        <span class="check-icon">✔</span>
        <span>إحصائيات متقدمة وسلاسل إنجاز دقيقة</span>
      </div>
    </div>
  </div>

  <div class="mockup-container">
    <div class="angled-phone">
      <div class="screen-inner">
        <div class="phone-header">
          <span>اليوم، 24 سبتمبر 🌿</span>
          <span style="font-size: 12px; color: #2A4B3A; background: #EBF2EE; padding: 3px 8px; border-radius: 12px;">4/5 مكتمل</span>
        </div>

        <div class="mock-progress">
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #57534E;">
            <span>نسبة إنجاز اليوم</span>
            <span style="color: #10B981; font-weight: 700;">80%</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar-inner"></div>
          </div>
        </div>

        <div class="mock-card">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; background: #EBF2EE; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">💧</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #1C1917;">شرب 2 لتر ماء</div>
              <div style="font-size: 11px; color: #B45309;">🔥 14 يوماً متتالياً</div>
            </div>
          </div>
          <div class="badge-completed">✔</div>
        </div>

        <div class="mock-card">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; background: #FEF3C7; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">📖</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #1C1917;">قراءة كتاب نافع</div>
              <div style="font-size: 11px; color: #B45309;">🔥 28 يوماً متتالياً</div>
            </div>
          </div>
          <div class="badge-completed">✔</div>
        </div>

        <div class="mock-card">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; background: #FEE2E2; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">🏃‍♂️</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: #1C1917;">تمارين الصباح</div>
              <div style="font-size: 11px; color: #B45309;">🔥 9 أيام متتالية</div>
            </div>
          </div>
          <div class="badge-completed">✔</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""
    out_file = os.path.join(OUTPUT_DIR, 'feature_graphic_1024x500.png')
    render_chrome(html, out_file, 1024, 500)


# ==============================================================================
# Helper for Phone Screenshot Container (1080 x 2400)
# ==============================================================================
def render_phone_screenshot(pill_text, title, subtitle, screen_content_html, output_filename, active_tab_index=0):
    tab_1_class = "tab-item active" if active_tab_index == 0 else "tab-item"
    tab_2_class = "tab-item active" if active_tab_index == 1 else "tab-item"
    tab_3_class = "tab-item active" if active_tab_index == 2 else "tab-item"

    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<style>
  {COMMON_CSS}
  body {{
    width: 1080px;
    height: 2400px;
    background: radial-gradient(circle at 50% 12%, #193d2c 0%, #0d2017 48%, #050d09 100%);
    font-family: 'Noto Sans Arabic', sans-serif;
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  .glow-orb {{
    position: absolute;
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%);
    top: 30px;
    left: 140px;
    pointer-events: none;
    z-index: 1;
  }}

  .marketing-header {{
    margin-top: 90px;
    text-align: center;
    z-index: 10;
    padding: 0 40px;
    height: 290px;
  }}
  .marketing-pill {{
    display: inline-block;
    padding: 10px 28px;
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(52, 211, 153, 0.45);
    border-radius: 999px;
    color: #34D399;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 22px;
    font-family: 'Noto Kufi Arabic', sans-serif;
  }}
  .marketing-title {{
    font-family: 'Noto Kufi Arabic', sans-serif;
    font-size: 56px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.35;
    margin: 0 0 16px 0;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }}
  .marketing-subtitle {{
    font-size: 28px;
    color: #A7F3D0;
    margin: 0;
    font-weight: 400;
    line-height: 1.5;
  }}

  .phone-frame {{
    position: absolute;
    bottom: -50px;
    width: 900px;
    height: 1950px;
    background: #1A201D;
    border-radius: 64px 64px 0 0;
    padding: 16px 16px 0 16px;
    box-shadow: 0 -20px 60px rgba(0,0,0,0.85), 0 0 0 3px rgba(255,255,255,0.08), 0 0 120px rgba(16, 185, 129, 0.22);
    z-index: 5;
  }}

  .phone-screen {{
    width: 100%;
    height: 100%;
    background: #FAF9F6;
    border-radius: 50px 50px 0 0;
    overflow: hidden;
    color: #1C1917;
    display: flex;
    flex-direction: column;
    position: relative;
  }}

  .status-bar {{
    direction: ltr;
    height: 60px;
    padding: 14px 44px 0 44px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 20px;
    font-weight: 700;
    color: #1C1917;
    z-index: 20;
  }}
  .dynamic-island {{
    width: 160px;
    height: 32px;
    background: #000;
    border-radius: 20px;
  }}

  /* App Bottom Tab Bar */
  .app-tabbar {{
    position: absolute;
    bottom: 50px;
    left: 0;
    right: 0;
    height: 94px;
    background: rgba(250, 249, 246, 0.96);
    backdrop-filter: blur(20px);
    border-top: 1px solid #EBEAE5;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 40px;
  }}
  .tab-item {{
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    color: #78716C;
    font-size: 19px;
  }}
  .tab-item.active {{
    color: #2A4B3A;
    font-weight: 700;
  }}
  .tab-pill {{
    padding: 8px 26px;
    background: #EBF2EE;
    border-radius: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }}
</style>
</head>
<body>
  <div class="glow-orb"></div>

  <div class="marketing-header">
    <div class="marketing-pill">{pill_text}</div>
    <h1 class="marketing-title">{title}</h1>
    <p class="marketing-subtitle">{subtitle}</p>
  </div>

  <div class="phone-frame">
    <div class="phone-screen">
      <div class="status-bar">
        <span>09:41</span>
        <div class="dynamic-island"></div>
        <span>5G 📶 100%</span>
      </div>

      {screen_content_html}

      <div class="app-tabbar">
        <div class="{tab_1_class}">
          {f'<div class="tab-pill"><span>🌿</span><span>الرئيسية</span></div>' if active_tab_index == 0 else '<span>🌿</span><span>الرئيسية</span>'}
        </div>
        <div class="{tab_2_class}">
          {f'<div class="tab-pill"><span>📊</span><span>الإحصائيات</span></div>' if active_tab_index == 1 else '<span>📊</span><span>الإحصائيات</span>'}
        </div>
        <div class="{tab_3_class}">
          {f'<div class="tab-pill"><span>⚙️</span><span>الإعدادات</span></div>' if active_tab_index == 2 else '<span>⚙️</span><span>الإعدادات</span>'}
        </div>
      </div>

    </div>
  </div>
</body>
</html>"""
    out_file = os.path.join(SCREENSHOTS_DIR, output_filename)
    render_chrome(html, out_file, 1080, 2400)


# ==============================================================================
# 2. SCREENSHOT 1: HOME SCREEN
# ==============================================================================
def generate_screenshot_1():
    content = """
      <div style="padding: 12px 36px 16px 36px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 34px; font-weight: 700; color: #1C1917; margin: 0;">اليوم، 24 سبتمبر</h2>
          <span style="font-size: 19px; color: #78716C;">ركز على أهدافك خطوة بخطوة 🌿</span>
        </div>
        <div style="display: flex; gap: 14px;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #F4F3EF; display: flex; align-items: center; justify-content: center; font-size: 22px;">🔍</div>
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px;">➕</div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; padding: 6px 28px 16px 28px;">
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #fff; border: 1px solid #EBEAE5;">
          <span style="font-size: 18px; color: #78716C; margin-bottom: 4px;">السبت</span>
          <span style="font-size: 24px; font-weight: 700; color: #1C1917;">20</span>
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; margin-top: 6px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #fff; border: 1px solid #EBEAE5;">
          <span style="font-size: 18px; color: #78716C; margin-bottom: 4px;">الأحد</span>
          <span style="font-size: 24px; font-weight: 700; color: #1C1917;">21</span>
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; margin-top: 6px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #fff; border: 1px solid #EBEAE5;">
          <span style="font-size: 18px; color: #78716C; margin-bottom: 4px;">الاثنين</span>
          <span style="font-size: 24px; font-weight: 700; color: #1C1917;">22</span>
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; margin-top: 6px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #fff; border: 1px solid #EBEAE5;">
          <span style="font-size: 18px; color: #78716C; margin-bottom: 4px;">الثلاثاء</span>
          <span style="font-size: 24px; font-weight: 700; color: #1C1917;">23</span>
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #10B981; margin-top: 6px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #2A4B3A; color: #fff; box-shadow: 0 6px 16px rgba(42, 75, 58, 0.25);">
          <span style="font-size: 18px; margin-bottom: 4px;">الأربعاء</span>
          <span style="font-size: 24px; font-weight: 700;">24</span>
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #fff; margin-top: 6px;"></div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #fff; border: 1px solid #EBEAE5;">
          <span style="font-size: 18px; color: #78716C; margin-bottom: 4px;">الخميس</span>
          <span style="font-size: 24px; font-weight: 700; color: #1C1917;">25</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding: 12px 10px; border-radius: 22px; width: 104px; background: #fff; border: 1px solid #EBEAE5;">
          <span style="font-size: 18px; color: #78716C; margin-bottom: 4px;">الجمعة</span>
          <span style="font-size: 24px; font-weight: 700; color: #1C1917;">26</span>
        </div>
      </div>

      <div style="background: #FFFFFF; border-radius: 28px; padding: 22px 28px; margin: 0 28px 20px 28px; border: 1px solid #EBEAE5; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 24px; font-weight: 700; color: #1C1917;">إنجاز اليوم 🌿</span>
          <span style="font-size: 21px; color: #2A4B3A; font-weight: 700;">4 من 5 عادات (80%)</span>
        </div>
        <div style="height: 14px; background: #EBF2EE; border-radius: 999px; overflow: hidden;">
          <div style="width: 80%; height: 100%; background: linear-gradient(90deg, #10B981, #2A4B3A); border-radius: 999px;"></div>
        </div>
      </div>

      <div style="padding: 0 28px; display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #FFFFFF; border-radius: 24px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 18px; background: #EBF2EE; display: flex; align-items: center; justify-content: center; font-size: 30px;">💧</div>
            <div>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 23px; font-weight: 700; color: #1C1917;">شرب 2 لتر ماء</div>
              <div style="font-size: 18px; color: #78716C; margin-top: 4px; display: flex; gap: 12px;">
                <span>الهدف: 8 أكواب</span>
                <span style="color: #B45309; font-weight: 700;">🔥 14 يوماً متتالياً</span>
              </div>
            </div>
          </div>
          <div style="width: 54px; height: 54px; border-radius: 18px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 4px 12px rgba(42, 75, 58, 0.25);">✔</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 18px; background: #FEF3C7; display: flex; align-items: center; justify-content: center; font-size: 30px;">📖</div>
            <div>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 23px; font-weight: 700; color: #1C1917;">قراءة في كتاب نافع</div>
              <div style="font-size: 18px; color: #78716C; margin-top: 4px; display: flex; gap: 12px;">
                <span>الهدف: 20 صفحة</span>
                <span style="color: #B45309; font-weight: 700;">🔥 28 يوماً متتالياً</span>
              </div>
            </div>
          </div>
          <div style="width: 54px; height: 54px; border-radius: 18px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 4px 12px rgba(42, 75, 58, 0.25);">✔</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 18px; background: #FEE2E2; display: flex; align-items: center; justify-content: center; font-size: 30px;">🏃‍♂️</div>
            <div>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 23px; font-weight: 700; color: #1C1917;">تمارين الصباح الرياضية</div>
              <div style="font-size: 18px; color: #78716C; margin-top: 4px; display: flex; gap: 12px;">
                <span>الهدف: 30 دقيقة</span>
                <span style="color: #B45309; font-weight: 700;">🔥 9 أيام متتالية</span>
              </div>
            </div>
          </div>
          <div style="width: 54px; height: 54px; border-radius: 18px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 4px 12px rgba(42, 75, 58, 0.25);">✔</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 18px; background: #EDE9FE; display: flex; align-items: center; justify-content: center; font-size: 30px;">🧘</div>
            <div>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 23px; font-weight: 700; color: #1C1917;">التأمل والسكينة</div>
              <div style="font-size: 18px; color: #78716C; margin-top: 4px; display: flex; gap: 12px;">
                <span>الهدف: 10 دقائق</span>
                <span style="color: #B45309; font-weight: 700;">🔥 21 يوماً متتالياً</span>
              </div>
            </div>
          </div>
          <div style="width: 54px; height: 54px; border-radius: 18px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; box-shadow: 0 4px 12px rgba(42, 75, 58, 0.25);">✔</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 18px; background: #E0F2FE; display: flex; align-items: center; justify-content: center; font-size: 30px;">✍️</div>
            <div>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 23px; font-weight: 700; color: #1C1917;">تدوين خواطر المساء</div>
              <div style="font-size: 18px; color: #78716C; margin-top: 4px; display: flex; gap: 12px;">
                <span>الهدف: مذكرات يومية</span>
                <span style="color: #78716C;">متبقي لليوم</span>
              </div>
            </div>
          </div>
          <div style="width: 54px; height: 54px; border-radius: 18px; background: #F4F3EF; border: 2px solid #EBEAE5;"></div>
        </div>
      </div>
    """
    render_phone_screenshot(
        pill_text="✦ رفيقك لبناء حياة أفضل ✦",
        title="ابنِ عاداتك اليومية بهدوء ويسر",
        subtitle="واجهة بسيطة وذكية تنظم يومك وتزيد إنتاجيتك دون أي تشتيت",
        screen_content_html=content,
        output_filename="phone_1_home.png",
        active_tab_index=0
    )


# ==============================================================================
# 3. SCREENSHOT 2: STATISTICS SCREEN
# ==============================================================================
def generate_screenshot_2():
    content = """
      <div style="padding: 14px 36px 16px 36px;">
        <h2 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 34px; font-weight: 700; color: #1C1917; margin: 0;">الإحصائيات والتحليلات 📊</h2>
        <span style="font-size: 19px; color: #78716C;">نظرة شاملة ودقيقة على التزامك ونموك الشخصي</span>
      </div>

      <!-- 2x2 Metric Summary Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 28px 18px 28px;">
        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="font-size: 18px; color: #78716C; margin-bottom: 6px;">🎯 إجمالي الإنجازات</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 42px; font-weight: 700; color: #2A4B3A;">342</div>
          <div style="font-size: 15px; color: #10B981; font-weight: 600;">+24 إنجاز هذا الأسبوع</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="font-size: 18px; color: #78716C; margin-bottom: 6px;">🔥 أطول سلسلة متتالية</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 42px; font-weight: 700; color: #B45309;">45 <span style="font-size: 20px; font-weight: 400; color: #78716C;">يوماً</span></div>
          <div style="font-size: 15px; color: #B45309; font-weight: 600;">عادة قراءة الكتاب 📖</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="font-size: 18px; color: #78716C; margin-bottom: 6px;">🌿 العادات النشطة</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 42px; font-weight: 700; color: #1C1917;">5 <span style="font-size: 20px; font-weight: 400; color: #78716C;">عادات</span></div>
          <div style="font-size: 15px; color: #10B981; font-weight: 600;">100% نسبة الالتزام اليوم</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="font-size: 18px; color: #78716C; margin-bottom: 6px;">📈 معدل الالتزام الشهري</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 42px; font-weight: 700; color: #10B981;">92%</div>
          <div style="font-size: 15px; color: #10B981; font-weight: 600;">أعلى بـ 8% من الشهر السابق</div>
        </div>
      </div>

      <!-- Weekly Chart Card (with generous margin to prevent overlap) -->
      <div style="background: #FFFFFF; border-radius: 28px; padding: 24px; margin: 0 28px 20px 28px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 34px;">
          <div>
            <h3 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917; margin: 0;">نسبة الالتزام الأسبوعي</h3>
            <span style="font-size: 16px; color: #78716C;">معدل الأيام السبعة الأخيرة</span>
          </div>
          <span style="font-size: 17px; color: #2A4B3A; font-weight: 700; background: #EBF2EE; padding: 6px 16px; border-radius: 12px;">المعدل: 89%</span>
        </div>

        <!-- Bars Container -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; height: 170px; padding: 0 10px 6px 10px;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #2A4B3A;">100%</span>
            <div style="width: 44px; height: 125px; background: #2A4B3A; border-radius: 12px;"></div>
            <span style="font-size: 17px; color: #57534E;">السبت</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #10B981;">85%</span>
            <div style="width: 44px; height: 105px; background: #10B981; border-radius: 12px;"></div>
            <span style="font-size: 17px; color: #57534E;">الأحد</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #2A4B3A;">90%</span>
            <div style="width: 44px; height: 112px; background: #2A4B3A; border-radius: 12px;"></div>
            <span style="font-size: 17px; color: #57534E;">الاثنين</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #2A4B3A;">95%</span>
            <div style="width: 44px; height: 118px; background: #2A4B3A; border-radius: 12px;"></div>
            <span style="font-size: 17px; color: #57534E;">الثلاثاء</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #10B981;">100%</span>
            <div style="width: 44px; height: 125px; background: linear-gradient(180deg, #10B981, #2A4B3A); border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);"></div>
            <span style="font-size: 17px; color: #2A4B3A; font-weight: 700;">الأربعاء</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #10B981;">80%</span>
            <div style="width: 44px; height: 100px; background: #10B981; border-radius: 12px;"></div>
            <span style="font-size: 17px; color: #57534E;">الخميس</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <span style="font-size: 15px; font-weight: 700; color: #10B981;">75%</span>
            <div style="width: 44px; height: 92px; background: #10B981; border-radius: 12px;"></div>
            <span style="font-size: 17px; color: #57534E;">الجمعة</span>
          </div>
        </div>
      </div>

      <!-- Milestone Badges Section -->
      <div style="padding: 0 28px;">
        <h3 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917; margin-bottom: 12px;">أوسمة الإنجاز والتحفيز 🏅</h3>
        <div style="display: flex; gap: 14px;">
          <div style="flex: 1; background: #FFFFFF; border-radius: 20px; padding: 16px; border: 1px solid #EBEAE5; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size: 34px; margin-bottom: 6px;">🏅</div>
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 17px; font-weight: 700; color: #1C1917;">أسبوع ذهبي</div>
            <div style="font-size: 14px; color: #10B981; font-weight: 600; margin-top: 2px;">مكتمل بنجاح ✅</div>
          </div>
          <div style="flex: 1; background: #FFFFFF; border-radius: 20px; padding: 16px; border: 1px solid #EBEAE5; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size: 34px; margin-bottom: 6px;">🥈</div>
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 17px; font-weight: 700; color: #1C1917;">شمس 30 يوماً</div>
            <div style="font-size: 14px; color: #10B981; font-weight: 600; margin-top: 2px;">مكتمل بنجاح ✅</div>
          </div>
          <div style="flex: 1; background: #FFFFFF; border-radius: 20px; padding: 16px; border: 1px solid #EBEAE5; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <div style="font-size: 34px; margin-bottom: 6px;">👑</div>
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 17px; font-weight: 700; color: #1C1917;">تاج المئة يوم</div>
            <div style="font-size: 14px; color: #B45309; font-weight: 600; margin-top: 2px;">45 من 100 يوم</div>
          </div>
        </div>
      </div>
    """
    render_phone_screenshot(
        pill_text="✦ تحليلات عميقة وسلاسل استمرار ✦",
        title="إحصائيات متقدمة وسلاسل إنجاز",
        subtitle="تابع استمرارية عاداتك واحتفل بكل خطوة تخطوها نحو أهدافك",
        screen_content_html=content,
        output_filename="phone_2_statistics.png",
        active_tab_index=1
    )


# ==============================================================================
# 4. SCREENSHOT 3: ADD HABIT SCREEN
# ==============================================================================
def generate_screenshot_3():
    content = """
      <div style="padding: 16px 36px 20px 36px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 34px; font-weight: 700; color: #1C1917; margin: 0;">إضافة عادة جديدة ✨</h2>
          <span style="font-size: 19px; color: #78716C;">حدد تفاصيل عادتك وخصصها كما تحب</span>
        </div>
        <div style="width: 44px; height: 44px; border-radius: 50%; background: #F4F3EF; display: flex; align-items: center; justify-content: center; font-size: 20px;">✕</div>
      </div>

      <div style="padding: 0 28px; display: flex; flex-direction: column; gap: 20px;">
        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <label style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 20px; font-weight: 700; color: #1C1917; display: block; margin-bottom: 12px;">اسم العادة</label>
          <div style="background: #FAF9F6; border: 1.5px solid #2A4B3A; border-radius: 16px; padding: 16px 20px; font-size: 22px; color: #1C1917; display: flex; align-items: center; gap: 12px;">
            <span>📖</span>
            <span style="font-weight: 600;">قراءة 20 صفحة من كتاب</span>
          </div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <label style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 20px; font-weight: 700; color: #1C1917; display: block; margin-bottom: 14px;">تكرار العادة</label>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; padding: 14px 10px; background: #2A4B3A; color: #FFFFFF; border-radius: 16px; text-align: center; font-size: 20px; font-weight: 700; font-family: 'Noto Kufi Arabic', sans-serif; box-shadow: 0 4px 12px rgba(42, 75, 58, 0.25);">يومي (كل يوم)</div>
            <div style="flex: 1; padding: 14px 10px; background: #FAF9F6; color: #57534E; border: 1px solid #EBEAE5; border-radius: 16px; text-align: center; font-size: 20px; font-weight: 600;">أيام محددة</div>
            <div style="flex: 1; padding: 14px 10px; background: #FAF9F6; color: #57534E; border: 1px solid #EBEAE5; border-radius: 16px; text-align: center; font-size: 20px; font-weight: 600;">مرن أسبوعي</div>
          </div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <label style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 20px; font-weight: 700; color: #1C1917; display: block; margin-bottom: 14px;">الهدف اليومي المستهدف</label>
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FAF9F6; border: 1px solid #EBEAE5; border-radius: 16px; padding: 12px 20px;">
            <span style="font-size: 21px; color: #1C1917; font-weight: 600;">الكمية اليومية المطلوبة</span>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 40px; height: 40px; background: #FFFFFF; border: 1px solid #EBEAE5; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; color: #2A4B3A;">-</div>
              <span style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 26px; font-weight: 700; color: #2A4B3A;">20 صفحة</span>
              <div style="width: 40px; height: 40px; background: #2A4B3A; color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700;">+</div>
            </div>
          </div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 20px; font-weight: 700; color: #1C1917;">تذكير محلي ذكي ⏰</div>
            <div style="font-size: 17px; color: #78716C; margin-top: 4px;">تنبيه هادئ في الوقت الذي تحدده</div>
          </div>
          <div style="background: #EBF2EE; color: #2A4B3A; padding: 10px 20px; border-radius: 16px; font-size: 22px; font-weight: 700;">09:30 مساءً</div>
        </div>

        <div style="background: #FFFFFF; border-radius: 24px; padding: 22px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <label style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 20px; font-weight: 700; color: #1C1917; display: block; margin-bottom: 14px;">لون العادة المميز</label>
          <div style="display: flex; justify-content: space-between;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #2A4B3A; border: 4px solid #10B981; box-shadow: 0 4px 10px rgba(0,0,0,0.15);"></div>
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #0F766E;"></div>
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #1E3A8A;"></div>
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #B45309;"></div>
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #991B1B;"></div>
            <div style="width: 52px; height: 52px; border-radius: 50%; background: #581C87;"></div>
          </div>
        </div>

        <div style="margin-top: 6px; background: #2A4B3A; color: #FFFFFF; padding: 20px; border-radius: 22px; text-align: center; font-family: 'Noto Kufi Arabic', sans-serif; font-size: 24px; font-weight: 700; box-shadow: 0 8px 24px rgba(42, 75, 58, 0.35);">
          حفظ العادة والبدء 🚀
        </div>
      </div>
    """
    render_phone_screenshot(
        pill_text="✦ تخصيص مرن يناسب أهدافك ✦",
        title="تخصيص كامل ومرن لعاداتك",
        subtitle="أنشئ عادات يومية أو أسبوعية بتذكيرات ذكية وأهداف رقمية دقيقة",
        screen_content_html=content,
        output_filename="phone_3_add_habit.png",
        active_tab_index=0
    )


# ==============================================================================
# 5. SCREENSHOT 4: PRIVACY & OFFLINE-FIRST (Full Screen Balanced)
# ==============================================================================
def generate_screenshot_4():
    content = """
      <div style="padding: 16px 36px 18px 36px;">
        <h2 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 34px; font-weight: 700; color: #1C1917; margin: 0;">الخصوصية والأمان 🛡️</h2>
        <span style="font-size: 19px; color: #78716C;">تطبيق محلي 100% صُمم ليحترم خصوصيتك بالكامل</span>
      </div>

      <div style="padding: 0 28px; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Big Trust Card -->
        <div style="background: linear-gradient(135deg, #2A4B3A, #183325); border-radius: 26px; padding: 24px; color: #FFFFFF; box-shadow: 0 8px 24px rgba(42, 75, 58, 0.25);">
          <div style="font-size: 34px; margin-bottom: 6px;">🌱</div>
          <h3 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 25px; font-weight: 700; margin-bottom: 6px;">بياناتك ملكك وحدك</h3>
          <p style="font-size: 18px; line-height: 1.55; color: #A7F3D0; margin: 0;">
            تطبيق "إنجاز" يعمل وفق فلسفة (Local-First). جميع عاداتك وسجلاتك تبقى محفوظة محلياً داخل هاتفك فقط، دون أي اتصال بخوادم خارجية أو جمع للمعلومات.
          </p>
        </div>

        <!-- Pillar 1 -->
        <div style="background: #FFFFFF; border-radius: 22px; padding: 18px 22px; border: 1px solid #EBEAE5; display: flex; gap: 18px; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="width: 54px; height: 54px; border-radius: 16px; background: #EBF2EE; color: #2A4B3A; display: flex; align-items: center; justify-content: center; font-size: 26px;">📴</div>
          <div style="flex: 1;">
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 21px; font-weight: 700; color: #1C1917;">يعمل دون اتصال بالإنترنت</div>
            <div style="font-size: 16px; color: #78716C; margin-top: 3px;">تتبع عاداتك في أي مكان وزمان، على الطائرة أو في السفر دون حاجة لشبكة.</div>
          </div>
        </div>

        <!-- Pillar 2 -->
        <div style="background: #FFFFFF; border-radius: 22px; padding: 18px 22px; border: 1px solid #EBEAE5; display: flex; gap: 18px; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="width: 54px; height: 54px; border-radius: 16px; background: #FEF3C7; color: #B45309; display: flex; align-items: center; justify-content: center; font-size: 26px;">🚫</div>
          <div style="flex: 1;">
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 21px; font-weight: 700; color: #1C1917;">بدون تسجيل دخول أو حساب</div>
            <div style="font-size: 16px; color: #78716C; margin-top: 3px;">لا نطلب بريدك الإلكتروني، ولا رقم هاتفك، ولا أي كلمة مرور. ابدأ فوراً!</div>
          </div>
        </div>

        <!-- Pillar 3 -->
        <div style="background: #FFFFFF; border-radius: 22px; padding: 18px 22px; border: 1px solid #EBEAE5; display: flex; gap: 18px; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="width: 54px; height: 54px; border-radius: 16px; background: #FEE2E2; color: #991B1B; display: flex; align-items: center; justify-content: center; font-size: 26px;">✨</div>
          <div style="flex: 1;">
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 21px; font-weight: 700; color: #1C1917;">خالٍ تماماً من الإعلانات</div>
            <div style="font-size: 16px; color: #78716C; margin-top: 3px;">بيئة هادئة ونقية 100% بدون أي لافتات ترويجية أو نوافذ منبثقة مزعجة.</div>
          </div>
        </div>

        <!-- Pillar 4 -->
        <div style="background: #FFFFFF; border-radius: 22px; padding: 18px 22px; border: 1px solid #EBEAE5; display: flex; gap: 18px; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="width: 54px; height: 54px; border-radius: 16px; background: #E0F2FE; color: #0369A1; display: flex; align-items: center; justify-content: center; font-size: 26px;">📦</div>
          <div style="flex: 1;">
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 21px; font-weight: 700; color: #1C1917;">نسخ احتياطي واستيراد آمن</div>
            <div style="font-size: 16px; color: #78716C; margin-top: 3px;">صدّر كامل عاداتك وسجلاتك بضغطة زر بصيغة JSON واحتفظ بها أينما شئت.</div>
          </div>
        </div>

        <!-- Pillar 5 -->
        <div style="background: #FFFFFF; border-radius: 22px; padding: 18px 22px; border: 1px solid #EBEAE5; display: flex; gap: 18px; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="width: 54px; height: 54px; border-radius: 16px; background: #EDE9FE; color: #581C87; display: flex; align-items: center; justify-content: center; font-size: 26px;">⚡</div>
          <div style="flex: 1;">
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 21px; font-weight: 700; color: #1C1917;">أداء فائق واستجابة فورية</div>
            <div style="font-size: 16px; color: #78716C; margin-top: 3px;">حجم خفيف جداً، استهلاك بطارية شبه منعدم، وتشغيل لحظي دون انتظار.</div>
          </div>
        </div>

        <!-- Guarantee Pill Banner -->
        <div style="background: #FAF9F6; border: 1.5px dashed #2A4B3A; border-radius: 20px; padding: 14px 20px; text-align: center; color: #2A4B3A; font-family: 'Noto Kufi Arabic', sans-serif; font-size: 18px; font-weight: 700;">
          🔒 عهد الخصوصية: لا وصول لبياناتك إلا من خلالك وحدك
        </div>

      </div>
    """
    render_phone_screenshot(
        pill_text="✦ خصوصيتك أولويتنا المطلقة ✦",
        title="خصوصية تامة ومحلي بالكامل",
        subtitle="بياناتك على جهازك فقط، دون خوادم سحابية ولا حسابات ولا إعلانات",
        screen_content_html=content,
        output_filename="phone_4_privacy_offline.png",
        active_tab_index=2
    )


# ==============================================================================
# 6. TABLET SCREENSHOTS (1600 x 2560)
# ==============================================================================
def generate_tablet_1():
    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<style>
  {COMMON_CSS}
  body {{
    width: 1600px;
    height: 2560px;
    background: radial-gradient(circle at 50% 12%, #193d2c 0%, #0d2017 48%, #050d09 100%);
    font-family: 'Noto Sans Arabic', sans-serif;
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  .glow-orb {{
    position: absolute;
    width: 1200px;
    height: 1200px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%);
    top: 50px;
    pointer-events: none;
    z-index: 1;
  }}

  .marketing-header {{
    margin-top: 100px;
    text-align: center;
    z-index: 10;
    padding: 0 60px;
    height: 320px;
  }}
  .marketing-pill {{
    display: inline-block;
    padding: 12px 36px;
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(52, 211, 153, 0.45);
    border-radius: 999px;
    color: #34D399;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 24px;
    font-family: 'Noto Kufi Arabic', sans-serif;
  }}
  .marketing-title {{
    font-family: 'Noto Kufi Arabic', sans-serif;
    font-size: 72px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.35;
    margin: 0 0 20px 0;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }}
  .marketing-subtitle {{
    font-size: 34px;
    color: #A7F3D0;
    margin: 0;
    font-weight: 400;
    line-height: 1.5;
  }}

  .tablet-frame {{
    position: absolute;
    bottom: -60px;
    width: 1440px;
    height: 2060px;
    background: #1A201D;
    border-radius: 56px 56px 0 0;
    padding: 24px 24px 0 24px;
    box-shadow: 0 -20px 70px rgba(0,0,0,0.9), 0 0 0 3px rgba(255,255,255,0.08), 0 0 140px rgba(16, 185, 129, 0.25);
    z-index: 5;
  }}

  .tablet-screen {{
    width: 100%;
    height: 100%;
    background: #FAF9F6;
    border-radius: 40px 40px 0 0;
    overflow: hidden;
    color: #1C1917;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 36px 44px;
  }}
</style>
</head>
<body>
  <div class="glow-orb"></div>

  <div class="marketing-header">
    <div class="marketing-pill">✦ تجربة رحبة للأجهزة اللوحية ✦</div>
    <h1 class="marketing-title">مصمم بعناية لكافة شاشاتك</h1>
    <p class="marketing-subtitle">استمتع بتنظيم عاداتك ومتابعة تقدمك عبر واجهة واسعة ومريحة للعين</p>
  </div>

  <div class="tablet-frame">
    <div class="tablet-screen">
      <!-- Top Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #EBEAE5; padding-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <img src="data:image/png;base64,{ICON_B64}" style="width: 64px; height: 64px; border-radius: 18px;" alt="Logo">
          <div>
            <h2 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 36px; font-weight: 700; color: #1C1917; margin: 0;">إنجاز | لوحة المتابعة الشاملة</h2>
            <span style="font-size: 21px; color: #78716C;">اليوم، 24 سبتمبر 🌿</span>
          </div>
        </div>
        <div style="display: flex; gap: 16px;">
          <div style="background: #2A4B3A; color: #fff; padding: 14px 32px; border-radius: 18px; font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700;">+ إضافة عادة جديدة</div>
        </div>
      </div>

      <!-- Two-column Wide Dashboard -->
      <div style="display: grid; grid-template-columns: 1fr 1.35fr; gap: 32px;">
        <!-- Left: Analytics & Streaks -->
        <div style="display: flex; flex-direction: column; gap: 22px;">
          <!-- Progress Card -->
          <div style="background: #FFFFFF; border-radius: 26px; padding: 26px; border: 1px solid #EBEAE5; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 24px; font-weight: 700; color: #1C1917;">إنجاز اليوم</span>
              <span style="font-size: 22px; color: #10B981; font-weight: 700;">4 من 5 عادات (80%)</span>
            </div>
            <div style="height: 16px; background: #EBF2EE; border-radius: 999px; overflow: hidden;">
              <div style="width: 80%; height: 100%; background: #10B981; border-radius: 999px;"></div>
            </div>
          </div>

          <!-- Quick Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
            <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
              <span style="font-size: 18px; color: #78716C;">🎯 الإنجازات</span>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 38px; font-weight: 700; color: #2A4B3A; margin-top: 6px;">342</div>
            </div>
            <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
              <span style="font-size: 18px; color: #78716C;">🔥 أطول سلسلة</span>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 38px; font-weight: 700; color: #B45309; margin-top: 6px;">45 يوماً</div>
            </div>
            <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
              <span style="font-size: 18px; color: #78716C;">🌿 العادات النشطة</span>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 38px; font-weight: 700; color: #1C1917; margin-top: 6px;">5 عادات</div>
            </div>
            <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
              <span style="font-size: 18px; color: #78716C;">📈 نسبة الالتزام</span>
              <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 38px; font-weight: 700; color: #10B981; margin-top: 6px;">92%</div>
            </div>
          </div>

          <!-- Privacy Trust Notice -->
          <div style="background: #EBF2EE; border-radius: 26px; padding: 26px; color: #2A4B3A;">
            <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 8px;">🛡️ أمان محلي 100% (Local-First)</div>
            <p style="font-size: 19px; line-height: 1.6; color: #3F6212; margin: 0;">جميع بياناتك وعاداتك محفوظة داخل هاتفك فقط، بدون خوادم سحابية وبدون أي إعلانات أو تسجيل.</p>
          </div>
        </div>

        <!-- Right: Habit List -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Habit 1 -->
          <div style="background: #FFFFFF; border-radius: 22px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 56px; height: 56px; border-radius: 18px; background: #EBF2EE; display: flex; align-items: center; justify-content: center; font-size: 28px;">💧</div>
              <div>
                <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">شرب 2 لتر ماء</div>
                <div style="font-size: 17px; color: #B45309; font-weight: 600; margin-top: 2px;">🔥 14 يوماً متتالياً</div>
              </div>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 16px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px;">✔</div>
          </div>

          <!-- Habit 2 -->
          <div style="background: #FFFFFF; border-radius: 22px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 56px; height: 56px; border-radius: 18px; background: #FEF3C7; display: flex; align-items: center; justify-content: center; font-size: 28px;">📖</div>
              <div>
                <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">قراءة كتاب نافع</div>
                <div style="font-size: 17px; color: #B45309; font-weight: 600; margin-top: 2px;">🔥 28 يوماً متتالياً</div>
              </div>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 16px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px;">✔</div>
          </div>

          <!-- Habit 3 -->
          <div style="background: #FFFFFF; border-radius: 22px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 56px; height: 56px; border-radius: 18px; background: #FEE2E2; display: flex; align-items: center; justify-content: center; font-size: 28px;">🏃‍♂️</div>
              <div>
                <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">تمارين الصباح الرياضية</div>
                <div style="font-size: 17px; color: #B45309; font-weight: 600; margin-top: 2px;">🔥 9 أيام متتالية</div>
              </div>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 16px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px;">✔</div>
          </div>

          <!-- Habit 4 -->
          <div style="background: #FFFFFF; border-radius: 22px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 56px; height: 56px; border-radius: 18px; background: #EDE9FE; display: flex; align-items: center; justify-content: center; font-size: 28px;">🧘</div>
              <div>
                <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">التأمل والسكينة</div>
                <div style="font-size: 17px; color: #B45309; font-weight: 600; margin-top: 2px;">🔥 21 يوماً متتالياً</div>
              </div>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 16px; background: #2A4B3A; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px;">✔</div>
          </div>

          <!-- Habit 5 -->
          <div style="background: #FFFFFF; border-radius: 22px; padding: 20px 24px; border: 1px solid #EBEAE5; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <div style="width: 56px; height: 56px; border-radius: 18px; background: #E0F2FE; display: flex; align-items: center; justify-content: center; font-size: 28px;">✍️</div>
              <div>
                <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">تدوين خواطر المساء</div>
                <div style="font-size: 17px; color: #78716C; margin-top: 2px;">متبقي لليوم</div>
              </div>
            </div>
            <div style="width: 48px; height: 48px; border-radius: 16px; background: #F4F3EF; border: 2px solid #EBEAE5;"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>"""
    out_file = os.path.join(SCREENSHOTS_DIR, 'tablet_1.png')
    render_chrome(html, out_file, 1600, 2560)


def generate_tablet_2():
    html = f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<style>
  {COMMON_CSS}
  body {{
    width: 1600px;
    height: 2560px;
    background: radial-gradient(circle at 50% 12%, #193d2c 0%, #0d2017 48%, #050d09 100%);
    font-family: 'Noto Sans Arabic', sans-serif;
    color: #fff;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }}

  .glow-orb {{
    position: absolute;
    width: 1200px;
    height: 1200px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 70%);
    top: 50px;
    pointer-events: none;
    z-index: 1;
  }}

  .marketing-header {{
    margin-top: 100px;
    text-align: center;
    z-index: 10;
    padding: 0 60px;
    height: 320px;
  }}
  .marketing-pill {{
    display: inline-block;
    padding: 12px 36px;
    background: rgba(16, 185, 129, 0.16);
    border: 1px solid rgba(52, 211, 153, 0.45);
    border-radius: 999px;
    color: #34D399;
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 24px;
    font-family: 'Noto Kufi Arabic', sans-serif;
  }}
  .marketing-title {{
    font-family: 'Noto Kufi Arabic', sans-serif;
    font-size: 72px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1.35;
    margin: 0 0 20px 0;
    text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }}
  .marketing-subtitle {{
    font-size: 34px;
    color: #A7F3D0;
    margin: 0;
    font-weight: 400;
    line-height: 1.5;
  }}

  .tablet-frame {{
    position: absolute;
    bottom: -60px;
    width: 1440px;
    height: 2060px;
    background: #1A201D;
    border-radius: 56px 56px 0 0;
    padding: 24px 24px 0 24px;
    box-shadow: 0 -20px 70px rgba(0,0,0,0.9), 0 0 0 3px rgba(255,255,255,0.08), 0 0 140px rgba(16, 185, 129, 0.25);
    z-index: 5;
  }}

  .tablet-screen {{
    width: 100%;
    height: 100%;
    background: #FAF9F6;
    border-radius: 40px 40px 0 0;
    overflow: hidden;
    color: #1C1917;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 36px 44px;
  }}
</style>
</head>
<body>
  <div class="glow-orb"></div>

  <div class="marketing-header">
    <div class="marketing-pill">✦ إحصائيات بصرية شاملة ✦</div>
    <h1 class="marketing-title">رؤى متكاملة لنمط حياتك</h1>
    <p class="marketing-subtitle">تابع رسومك البيانية ونسب التزامك الأسبوعية والشهرية بدقة واضحة</p>
  </div>

  <div class="tablet-frame">
    <div class="tablet-screen">
      <div style="margin-bottom: 28px;">
        <h2 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 38px; font-weight: 700; color: #1C1917; margin: 0;">مركز الإحصائيات والأوسمة 📈</h2>
        <span style="font-size: 22px; color: #78716C;">تحليل أداء العادات ومسار النمو الشخصي</span>
      </div>

      <!-- 4 Top Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px;">
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
          <div style="font-size: 17px; color: #78716C;">🎯 إجمالي الإنجازات</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 40px; font-weight: 700; color: #2A4B3A; margin-top: 6px;">342</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
          <div style="font-size: 17px; color: #78716C;">🔥 أطول سلسلة</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 40px; font-weight: 700; color: #B45309; margin-top: 6px;">45 يوماً</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
          <div style="font-size: 17px; color: #78716C;">🌿 العادات النشطة</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 40px; font-weight: 700; color: #1C1917; margin-top: 6px;">5 عادات</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5;">
          <div style="font-size: 17px; color: #78716C;">📈 نسبة الالتزام</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 40px; font-weight: 700; color: #10B981; margin-top: 6px;">92%</div>
        </div>
      </div>

      <!-- Weekly Chart Large -->
      <div style="background: #FFFFFF; border-radius: 26px; padding: 28px; border: 1px solid #EBEAE5; margin-bottom: 28px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px;">
          <div>
            <h3 style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 26px; font-weight: 700; color: #1C1917; margin: 0;">الالتزام الأسبوعي على مدار 7 أيام</h3>
            <span style="font-size: 18px; color: #78716C;">نسبة إكمال العادات اليومية مقارنة بالمستهدف</span>
          </div>
          <span style="font-size: 20px; color: #2A4B3A; font-weight: 700; background: #EBF2EE; padding: 8px 20px; border-radius: 14px;">المعدل: 89%</span>
        </div>

        <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 210px; padding: 0 20px 6px 20px;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #2A4B3A;">100%</span>
            <div style="width: 70px; height: 155px; background: #2A4B3A; border-radius: 16px;"></div>
            <span style="font-size: 20px; color: #57534E;">السبت</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #10B981;">85%</span>
            <div style="width: 70px; height: 130px; background: #10B981; border-radius: 16px;"></div>
            <span style="font-size: 20px; color: #57534E;">الأحد</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #2A4B3A;">90%</span>
            <div style="width: 70px; height: 138px; background: #2A4B3A; border-radius: 16px;"></div>
            <span style="font-size: 20px; color: #57534E;">الاثنين</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #2A4B3A;">95%</span>
            <div style="width: 70px; height: 146px; background: #2A4B3A; border-radius: 16px;"></div>
            <span style="font-size: 20px; color: #57534E;">الثلاثاء</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #10B981;">100%</span>
            <div style="width: 70px; height: 155px; background: linear-gradient(180deg, #10B981, #2A4B3A); border-radius: 16px; box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);"></div>
            <span style="font-size: 20px; color: #2A4B3A; font-weight: 700;">الأربعاء</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #10B981;">80%</span>
            <div style="width: 70px; height: 122px; background: #10B981; border-radius: 16px;"></div>
            <span style="font-size: 20px; color: #57534E;">الخميس</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
            <span style="font-size: 17px; font-weight: 700; color: #10B981;">75%</span>
            <div style="width: 70px; height: 114px; background: #10B981; border-radius: 16px;"></div>
            <span style="font-size: 20px; color: #57534E;">الجمعة</span>
          </div>
        </div>
      </div>

      <!-- Badges Row -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5; text-align: center;">
          <div style="font-size: 42px; margin-bottom: 8px;">🏅</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">وسام الأسبوع الذهبي</div>
          <div style="font-size: 17px; color: #10B981; font-weight: 600; margin-top: 4px;">مكتمل بنجاح (7 أيام متتالية) ✅</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5; text-align: center;">
          <div style="font-size: 42px; margin-bottom: 8px;">🥈</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">وسام الشهر الفضي</div>
          <div style="font-size: 17px; color: #10B981; font-weight: 600; margin-top: 4px;">مكتمل بنجاح (30 يوماً) ✅</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 22px; padding: 22px; border: 1px solid #EBEAE5; text-align: center;">
          <div style="font-size: 42px; margin-bottom: 8px;">👑</div>
          <div style="font-family: 'Noto Kufi Arabic', sans-serif; font-size: 22px; font-weight: 700; color: #1C1917;">وسام المئة يوم الماسي</div>
          <div style="font-size: 17px; color: #B45309; font-weight: 600; margin-top: 4px;">45 من 100 يوم قيد الإنجاز 🔥</div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>"""
    out_file = os.path.join(SCREENSHOTS_DIR, 'tablet_2.png')
    render_chrome(html, out_file, 1600, 2560)


if __name__ == '__main__':
    print("🚀 Re-rendering all 7 assets with refined pixel-perfect layouts...")
    generate_feature_graphic()
    generate_screenshot_1()
    generate_screenshot_2()
    generate_screenshot_3()
    generate_screenshot_4()
    generate_tablet_1()
    generate_tablet_2()
    print("✨ Finished rendering all assets.")
