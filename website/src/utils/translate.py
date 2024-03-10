import os
import openai
from pathlib import Path

# 设置你的OpenAI API密钥
openai.api_key = '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'

def translate_text(text, source_lang="zh", target_lang="en"):
    """
    使用OpenAI GPT-3.5进行文本翻译。
    """
    try:
        chat_completion = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "user",
                    "content": text,
                },
            ],
        )
    except openai.error.RateLimitError:
        print("You've hit the rate limit. Please wait before trying again.")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
    return None
    
def check_and_translate_md_files(directory):
    """
    检查并翻译指定目录下的所有Markdown文件。
    """
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md") and not file.startswith("translated_"):
                file_path = Path(root) / file
                translated_file_path = Path(root) / f"translated_{file}"
                
                # 检查翻译文件是否已存在
                if not translated_file_path.exists():
                    print(f"Translating: {file_path}")
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        translated_content = translate_text(content)
                        if translated_content:
                            with open(translated_file_path, 'w', encoding='utf-8') as tf:
                                tf.write(translated_content)
                            print(f"Translated and saved to: {translated_file_path}")
                        else:
                            print(f"Failed to translate: {file_path}")
                else:
                    print(f"Translation already exists for: {file_path}")

# 替换为你的目录路径
directory_path = 'website'
check_and_translate_md_files(directory_path)