import re
import wcwidth
import argparse
import sys

def wcswidth(s):
    """
    计算字符串在终端中的显示宽度。
    中文字符通常占 2 个宽度，英文字符占 1 个。
    """
    return wcwidth.wcswidth(s)

def fix_inner_boxes(filepath, dry_run=False):
    """
    自动对齐 Markdown 文件中的嵌套/独立 ASCII 框图。
    处理包括：
    - 读取最外层或内层盒子的宽度
    - 针对 `│` 到 `│` 里面的内容进行准确的 padding 填充
    - 修复因 GitHub 渲染或者中英文字符不对齐导致的排版错乱
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.read().split('\n')

    out_lines = []
    inner_box_started = False
    expected_inner_width = 0
    box_indent = ""
    outer_end_pad = ""

    for line in lines:
        stripped = line.rstrip()
        
        # 匹配框图顶部，如 "  ┌─────────┐   "
        m_start = re.match(r'^([\s│]+)┌(─+)┐(.*)$', stripped)
        if m_start and '│' in m_start.group(1):
            inner_box_started = True
            prefix = m_start.group(1)
            dashes = m_start.group(2)
            suffix = m_start.group(3)
            expected_inner_width = wcswidth("┌" + dashes + "┐")
            box_indent = prefix
            outer_end_pad = suffix
            out_lines.append(line)
            continue
            
        if inner_box_started:
            # 匹配框图底部，如 "  └─────────┘   "
            m_end = re.match(r'^([\s│]+)└(─+)┘(.*)$', stripped)
            if m_end and '│' in m_end.group(1):
                inner_box_started = False
                prefix = m_end.group(1)
                dashes = m_end.group(2)
                suffix = m_end.group(3)
                diff = expected_inner_width - wcswidth("└┘")
                out_lines.append(box_indent + "└" + "─" * diff + "┘" + outer_end_pad)
                continue
            
            # 匹配框图内容，如 "  │ Text    │   "
            m_mid = re.match(r'^([\s│]+)│(.*)│(.*)$', stripped)
            if m_mid:
                prefix = m_mid.group(1)
                inner_text = m_mid.group(2)
                suffix = m_mid.group(3)
                
                if prefix == box_indent:
                    current_w = wcswidth("│" + inner_text + "│")
                    if current_w < expected_inner_width:
                        pad = expected_inner_width - current_w
                        out_line = box_indent + "│" + inner_text + " " * pad + "│" + outer_end_pad
                        out_lines.append(out_line)
                    elif current_w > expected_inner_width:
                        pad_needed = current_w - expected_inner_width
                        if inner_text.endswith(" " * pad_needed):
                            out_line = box_indent + "│" + inner_text[:-pad_needed] + "│" + outer_end_pad
                            out_lines.append(out_line)
                        else:
                            out_lines.append(line)
                    else:
                        out_lines.append(box_indent + "│" + inner_text + "│" + outer_end_pad)
                    continue

        out_lines.append(line)
        
    if not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(out_lines))
    else:
        for i, (orig, new) in enumerate(zip(lines, out_lines)):
            if orig != new:
                print(f"Line {i+1} fixed:\n- {orig}\n+ {new}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Fix nested ASCII diagram alignments")
    parser.add_argument('files', nargs='+', help="Markdown files to process")
    parser.add_argument('--dry-run', action='store_true', help="Only print changes without saving")
    args = parser.parse_args()
    
    for f in args.files:
        fix_inner_boxes(f, args.dry_run)
        if not args.dry_run:
            print(f"Successfully processed {f}")
