"""Convert digits / symbols in narration text into spoken Mandarin for TTS. Display subtitles are untouched."""
import re

D = "零一二三四五六七八九"

def digits(s: str) -> str:
    return "".join(D[int(c)] for c in s)

def int_zh(n: int) -> str:
    if n == 0:
        return "零"
    units = ["", "十", "百", "千"]
    big = ["", "万", "亿"]
    out = ""
    i = 0
    while n > 0:
        part = n % 10000
        if part:
            seg = ""
            zero = False
            for pos in range(3, -1, -1):
                d = (part // (10 ** pos)) % 10
                if d == 0:
                    zero = True if seg else False
                else:
                    if zero:
                        seg += "零"
                        zero = False
                    seg += D[d] + units[pos]
            seg = re.sub(r"^一十", "十", seg)
            out = seg + big[i] + out
        n //= 10000
        i += 1
    return out

def number(s: str) -> str:
    if "." in s:
        a, b = s.split(".")
        return int_zh(int(a)) + "点" + digits(b)
    return int_zh(int(s))

def speakable(text: str) -> str:
    t = text
    t = t.replace("Nyx Lab", "尼克斯实验室")
    t = re.sub(r"H200", "H二零零", t)
    t = re.sub(r"H20", "H二零", t)
    t = t.replace("CEO", "C E O").replace("CFO", "C F O")
    # years like 2026年 -> digit reading
    t = re.sub(r"(\d{4})年", lambda m: digits(m.group(1)) + "年", t)
    # dates 3月23日 / 11月8日
    t = re.sub(r"(\d{1,2})月(\d{1,2})日", lambda m: int_zh(int(m.group(1))) + "月" + int_zh(int(m.group(2))) + "日", t)
    t = re.sub(r"(\d{1,2})月", lambda m: int_zh(int(m.group(1))) + "月", t)
    # percentages
    t = re.sub(r"(\d+(?:\.\d+)?)%", lambda m: "百分之" + number(m.group(1)), t)
    # remaining numbers (e.g. 8.7亿, 10位, 11席, 4%)
    t = re.sub(r"\d+(?:\.\d+)?", lambda m: number(m.group(0)), t)
    return t

if __name__ == "__main__":
    import json, sys
    for c in json.load(open(sys.argv[1], encoding="utf-8")):
        print(c["text"], "=>", speakable(c["text"]))
