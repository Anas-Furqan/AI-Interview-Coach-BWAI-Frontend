import re
from pathlib import Path

root = Path('.')
patterns = [
    (re.compile(r"background:\s*'linear-gradient\(135deg, rgba\(99, 102, 241, 0\.95\), rgba\(79, 70, 229, 0\.95\)\)'") , "background: 'var(--accent)'") ,
    (re.compile(r"background:\s*'linear-gradient\(135deg, rgba\(99,102,241,0\.95\), rgba\(79,70,229,0\.95\)\)'") , "background: 'var(--accent)'") ,
    (re.compile(r"background:\s*'linear-gradient\(135deg, rgba\(79, 70, 229, 0\.95\), rgba\(99, 102, 241, 0\.92\), rgba\(15, 23, 42, 0\.98\)\)'") , "background: 'rgba(15, 23, 42, 0.98)'") ,
    (re.compile(r"background:\s*'linear-gradient\(135deg, rgba\(99, 102, 241, 0\.95\), #10b981\)'") , "background: 'linear-gradient(135deg, var(--accent), #10b981)'") ,
    (re.compile(r"background:\s*'radial-gradient\(circle, rgba\(0, 212, 255, 0\.15\) 0%, transparent 70%\)'") , "background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)'") ,
    (re.compile(r"background:\s*'radial-gradient\(circle, rgba\(168, 85, 247, 0\.12\) 0%, transparent 70%\)'") , "background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)'") ,
    (re.compile(r"boxShadow:\s*'0 10px 30px rgba\(0, 212, 255, 0\.4\)'"), "boxShadow: '0 10px 30px rgba(99, 102, 241, 0.18)'") ,
    (re.compile(r"boxShadow:\s*'0 0 15px rgba\(0, 212, 255, 0\.4\)'"), "boxShadow: '0 0 15px rgba(99, 102, 241, 0.18)'") ,
    (re.compile(r"backgroundImage:\s*`radial-gradient\(circle at bottom right, rgba\(34, 211, 238, 0\.08\), transparent 20%\)`"), "backgroundImage: `radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.08), transparent 20%)`") ,
    (re.compile(r"background:\s*'linear-gradient\(135deg, rgba\(99, 102, 241, 0\.95\), rgba\(79, 70, 229, 0\.95\),?#?\)'") , "background: 'var(--accent)'") ,
    (re.compile(r"color:\s*'#94a3b8 !important'"), "color: 'var(--text-secondary) !important'") ,
    (re.compile(r"color:\s*'#94a3b8'"), "color: 'var(--text-secondary)'") ,
    (re.compile(r"background:\s*'linear-gradient\(135deg, rgba\(99, 102, 241, 0\.95\), rgba\(79, 70, 229, 0\.95\), #10b981\)'") , "background: 'linear-gradient(135deg, var(--accent), #10b981)'") ,
]

changed = []
for file in sorted(root.rglob('*.tsx')) + sorted(root.rglob('*.ts')):
    text = file.read_text(encoding='utf-8')
    original = text
    for pat, repl in patterns:
        text = pat.sub(repl, text)
    if text != original:
        file.write_text(text, encoding='utf-8')
        changed.append(file)

print('changed files:', len(changed))
for file in changed:
    print(file)
