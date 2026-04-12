#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
实时语音识别 GUI 应用
支持按住按钮说话，松开后自动识别中文语音
"""

import tkinter as tk
from tkinter import scrolledtext, messagebox
import threading
import numpy as np
import sounddevice as sd
import whisper
import queue
import sys
import opencc

class RealtimeSpeechGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("实时中文语音识别")
        self.root.geometry("600x600")
        
        # 音频参数
        self.SAMPLE_RATE = 16000
        self.recording = False
        self.audio_queue = queue.Queue()
        self.model = None
        
        # 创建繁简体转换器
        self.converter = opencc.OpenCC('t2s')  # 繁体转简体
        
        # 创建界面（必须在加载模型之前）
        self.create_widgets()
        
    def load_model(self):
        """加载 Whisper 模型"""
        try:
            self.status_label.config(text="正在加载模型，请稍候...")
            self.load_model_button.config(state=tk.DISABLED)
            self.root.update()
            
            # 使用用户选择的模型
            model_name = self.model_var.get()
            self.model = whisper.load_model(model_name)
            
            self.status_label.config(text=f"模型加载完成，按住按钮开始说话")
            self.speech_button.config(state=tk.NORMAL)
            self.root.update()
        except Exception as e:
            messagebox.showerror("错误", f"加载模型失败: {str(e)}")
            self.status_label.config(text="模型加载失败")
            self.load_model_button.config(state=tk.NORMAL)
    
    def on_model_change(self):
        """当模型选择改变时的回调"""
        # 如果已经加载了模型，提示用户重新加载
        if self.model is not None:
            self.speech_button.config(state=tk.DISABLED)
            self.status_label.config(text="请点击'加载模型'按钮重新加载")
            self.load_model_button.config(state=tk.NORMAL)
        else:
            self.status_label.config(text=f"已选择 {self.model_var.get()} 模型，请点击'加载模型'")
    
    def create_widgets(self):
        """创建 GUI 组件"""
        
        # 标题
        title_label = tk.Label(
            self.root, 
            text="实时中文语音识别", 
            font=("Arial", 18, "bold")
        )
        title_label.pack(pady=20)
        
        # 模型选择区域
        model_frame = tk.Frame(self.root)
        model_frame.pack(pady=10)
        
        model_label = tk.Label(
            model_frame,
            text="模型选择：",
            font=("Arial", 12)
        )
        model_label.pack(side=tk.LEFT, padx=5)
        
        # 模型选项
        self.model_var = tk.StringVar(value="base")
        model_options = ["base", "small", "medium", "large", "large-v3-turbo"]
        self.model_combobox = tk.OptionMenu(
            model_frame,
            self.model_var,
            *model_options,
            command=self.on_model_change
        )
        self.model_combobox.pack(side=tk.LEFT, padx=5)
        
        # 模型说明
        model_info_label = tk.Label(
            self.root,
            text="提示: small/medium/large 模型识别精度更高，但速度较慢",
            font=("Arial", 10),
            fg="gray"
        )
        model_info_label.pack(pady=5)
        
        # 状态标签
        self.status_label = tk.Label(
            self.root, 
            text="点击下方按钮加载模型", 
            font=("Arial", 12),
            fg="gray"
        )
        self.status_label.pack(pady=10)
        
        # 加载模型按钮
        self.load_model_button = tk.Button(
            self.root,
            text="加载模型",
            font=("Arial", 12),
            bg="#2196F3",
            fg="white",
            width=15,
            command=self.load_model
        )
        self.load_model_button.pack(pady=10)
        
        # 语音按钮
        self.speech_button = tk.Button(
            self.root,
            text="按住说话",
            font=("Arial", 14, "bold"),
            bg="#4CAF50",
            fg="white",
            width=20,
            height=2,
            relief=tk.RAISED,
            bd=5,
            state=tk.DISABLED  # 初始状态为禁用，等待模型加载
        )
        self.speech_button.pack(pady=20)
        
        # 绑定按钮事件
        self.speech_button.bind("<ButtonPress-1>", self.start_recording)
        self.speech_button.bind("<ButtonRelease-1>", self.stop_recording)
        
        # 识别结果显示区域
        result_label = tk.Label(
            self.root,
            text="识别结果：",
            font=("Arial", 12),
            anchor="w"
        )
        result_label.pack(fill="x", padx=20, pady=(10, 5))
        
        self.result_text = scrolledtext.ScrolledText(
            self.root,
            font=("Arial", 12),
            height=10,
            wrap=tk.WORD
        )
        self.result_text.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        # 清除按钮
        clear_button = tk.Button(
            self.root,
            text="清除结果",
            font=("Arial", 10),
            command=self.clear_result
        )
        clear_button.pack(pady=10)
    
    def start_recording(self, event):
        """开始录音"""
        if self.model is None:
            messagebox.showwarning("警告", "模型尚未加载完成，请稍候")
            return
        
        self.recording = True
        self.speech_button.config(text="正在录音...", bg="#f44336")
        self.status_label.config(text="正在录音，请说话...")
        
        # 在新线程中开始录音
        self.recording_thread = threading.Thread(target=self.record_audio)
        self.recording_thread.start()
    
    def stop_recording(self, event):
        """停止录音并识别"""
        if not self.recording:
            return
        
        self.recording = False
        self.speech_button.config(text="识别中...", bg="#FF9800")
        self.status_label.config(text="正在识别语音...")
        
        # 等待录音线程结束
        if hasattr(self, 'recording_thread'):
            self.recording_thread.join()
        
        # 在新线程中进行识别
        self.recognition_thread = threading.Thread(target=self.recognize_speech)
        self.recognition_thread.start()
    
    def record_audio(self):
        """录音函数"""
        try:
            # 使用 InputStream 进行录音
            audio_data = np.array([], dtype=np.float32)
            
            def callback(indata, frames, time, status):
                nonlocal audio_data
                if status:
                    print(f"录音状态: {status}")
                if self.recording:
                    audio_data = np.append(audio_data, indata.flatten())
            
            with sd.InputStream(callback=callback,
                                samplerate=self.SAMPLE_RATE,
                                channels=1,
                                dtype=np.float32):
                # 等待录音完成或用户松开按钮
                while self.recording:
                    sd.sleep(100)
            
            # 将录制的音频数据放入队列
            if len(audio_data) > 0:
                self.audio_queue.put(audio_data)
            
        except Exception as e:
            print(f"录音错误: {str(e)}")
            self.recording = False
    
    def recognize_speech(self):
        """识别语音"""
        try:
            # 从队列获取音频数据
            if not self.audio_queue.empty():
                audio_data = self.audio_queue.get()
                
                # 使用 Whisper 识别语音
                # language='zh' 指定为中文
                result = self.model.transcribe(
                    audio_data,
                    language='zh',
                    fp16=False  # 使用 fp32 以提高兼容性
                )
                
                # 获取识别结果
                text = result['text'].strip()
                
                if text:
                    # 将繁体字转换为简体字
                    simplified_text = self.converter.convert(text)
                    
                    # 在主线程中更新界面
                    self.root.after(0, lambda: self.update_result(simplified_text))
                else:
                    self.root.after(0, lambda: self.status_label.config(text="未识别到语音，请重试"))
            
        except Exception as e:
            print(f"识别错误: {str(e)}")
            self.root.after(0, lambda: self.status_label.config(text=f"识别失败: {str(e)}"))
        
        finally:
            # 重置按钮状态
            self.root.after(0, lambda: self.reset_button())
    
    def update_result(self, text):
        """更新识别结果"""
        self.result_text.insert(tk.END, text + "\n")
        self.result_text.see(tk.END)
        self.status_label.config(text="识别完成")
    
    def reset_button(self):
        """重置按钮状态"""
        self.speech_button.config(text="按住说话", bg="#4CAF50")
    
    def clear_result(self):
        """清除识别结果"""
        self.result_text.delete(1.0, tk.END)
        self.status_label.config(text="结果已清除")

def main():
    """主函数"""
    try:
        root = tk.Tk()
        app = RealtimeSpeechGUI(root)
        root.mainloop()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as e:
        messagebox.showerror("错误", f"程序启动失败: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()