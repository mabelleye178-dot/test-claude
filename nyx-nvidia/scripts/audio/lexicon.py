"""Pronunciation dictionary for the narration.
Azure: SSML <phoneme> / <say-as> / <sub> tags (pinyin via alphabet="sapi" zh-CN, letters spelled with <say-as interpret-as="characters">).
ElevenLabs / OpenAI: plain-text substitutions (these engines accept no phoneme markup for zh-CN).
Every entry below was checked against standard Putonghua readings (现代汉语词典).
"""
import re

# term -> (azure_ssml, plain_text_for_other_engines, note)
LEXICON = {
    "黄仁勋": ('<phoneme alphabet="sapi" ph="huang 2 ren 2 xun 1">黄仁勋</phoneme>', "黄仁勋", "勋 xūn 一声；避免误读为 xùn"),
    "英伟达": ('英伟达', "英伟达", "yīng wěi dá，常规读法"),
    "NVIDIA": ('<sub alias="英伟达">NVIDIA</sub>', "英伟达", "中文旁白统一读中文名"),
    "3.58%": ('<say-as interpret-as="cardinal">3.58</say-as>%', "百分之三点五八", "百分之三点五八"),
    "7.31%": ('<say-as interpret-as="cardinal">7.31</say-as>%', "百分之七点三一", ""),
    "7.43%": ('<say-as interpret-as="cardinal">7.43</say-as>%', "百分之七点四三", ""),
    "4%": ('4%', "百分之四", ""),
    "8.7亿": ('<say-as interpret-as="cardinal">8.7</say-as>亿', "八点七亿", "八点七亿"),
    "H20": ('<say-as interpret-as="characters">H</say-as><say-as interpret-as="digits">20</say-as>', "H二零", "读作 H 二零（行业通行读法）"),
    "H200": ('<say-as interpret-as="characters">H</say-as><say-as interpret-as="digits">200</say-as>', "H二零零", "读作 H 二零零"),
    "CEO": ('<say-as interpret-as="characters">CEO</say-as>', "C E O", "逐字母拼读"),
    "CFO": ('<say-as interpret-as="characters">CFO</say-as>', "C F O", "逐字母拼读"),
    "Megaspeed": ('<sub alias="Megaspeed">Megaspeed</sub>', "Megaspeed", "英文原名，不在旁白中出现"),
    "克雷斯": ('克雷斯', "克雷斯", "Colette Kress 中文译名"),
    "先锋领航": ('先锋领航', "先锋领航", "Vanguard 官方中文名"),
    "贝莱德": ('贝莱德', "贝莱德", "BlackRock 官方中文名"),
    "委托书": ('<phoneme alphabet="sapi" ph="wei 3 tuo 1 shu 1">委托书</phoneme>', "委托书", "wěi tuō shū"),
    "绝对多数条款": ('绝对多数条款', "绝对多数条款", "jué duì duō shù tiáo kuǎn"),
    "双层股权": ('双层股权', "双层股权", "shuāng céng gǔ quán"),
    "辞任": ('<phoneme alphabet="sapi" ph="ci 2 ren 4">辞任</phoneme>', "辞任", "cí rèn"),
    "任免": ('<phoneme alphabet="sapi" ph="ren 4 mian 3">任免</phoneme>', "任免", "rèn miǎn"),
    "情报资产": ('情报资产', "情报资产", ""),
    "Nyx Lab": ('<sub alias="尼克斯实验室">Nyx Lab</sub>', "尼克斯实验室", "品牌名，可按品牌要求改为英文读法"),
}

def _dates_ssml(t: str) -> str:
    # 2026年6月 / 11月8日 -> say-as date pieces; Azure reads 年月日 naturally, keep digits but mark years as digits
    t = re.sub(r"(\d{4})年", r'<say-as interpret-as="digits">\1</say-as>年', t)
    return t

def to_azure_ssml_text(text: str) -> str:
    t = text
    # longest keys first so H200 wins over H20
    for k in sorted(LEXICON, key=len, reverse=True):
        t = t.replace(k, LEXICON[k][0])
    t = _dates_ssml(t)
    # pauses: Chinese comma -> short break, full stop -> medium break
    t = t.replace("，", '，<break time="220ms"/>').replace("。", '。<break time="420ms"/>')
    return t

def to_plain(text: str) -> str:
    t = text
    for k in sorted(LEXICON, key=len, reverse=True):
        t = t.replace(k, LEXICON[k][1])
    # years to digit reading for engines that would read 2026 as a number
    D = "零一二三四五六七八九"
    t = re.sub(r"(\d{4})年", lambda m: "".join(D[int(c)] for c in m.group(1)) + "年", t)
    return t

if __name__ == "__main__":
    s = "2026年股东委托书显示，黄仁勋持有约8.7亿股，占3.58%。2025年，H20出口先受限，后放行。11月12日，黄仁勋辞任，克雷斯代理CEO。"
    print(to_azure_ssml_text(s)); print(to_plain(s))
