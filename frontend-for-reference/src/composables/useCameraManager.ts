import { ref } from 'vue'

type CameraConstraints = MediaStreamConstraints['video']

interface AttachOptions {
  mirror?: boolean
  constraints?: CameraConstraints
}

/**
 * 全局摄像头管理器，尽量让人脸识别与手势识别共享同一个 MediaStream，避免设备占用冲突。
 * 注意：不同约束同时请求时不会自动合并，必要时应在调用侧协调分辨率/镜像参数。
 */
class CameraManager {
  private stream: MediaStream | null = null
  private acquiring: Promise<MediaStream> | null = null
  private clients = 0

  public readonly permissionGranted = ref(false)
  public readonly permissionError = ref<string | null>(null)

  async getStream(constraints?: CameraConstraints): Promise<MediaStream> {
    if (this.stream) return this.stream
    if (this.acquiring) return this.acquiring

    this.acquiring = navigator.mediaDevices
      .getUserMedia({
        video: constraints ?? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      })
      .then((stream) => {
        this.stream = stream
        this.permissionGranted.value = true
        return stream
      })
      .catch((err) => {
        this.permissionError.value = err?.message || '无法访问摄像头'
        throw err
      })
      .finally(() => {
        this.acquiring = null
      })

    return this.acquiring
  }

  /**
   * 将共享流绑定到指定 video 元素，并返回释放函数。
   */
  async attach(videoEl: HTMLVideoElement, options?: AttachOptions): Promise<() => void> {
    const stream = await this.getStream(options?.constraints)
    this.clients += 1
    videoEl.srcObject = stream
    videoEl.playsInline = true
    videoEl.muted = true
    if (options?.mirror) {
      videoEl.style.transform = 'scaleX(-1)'
    }
    await videoEl.play()

    const release = () => {
      if (options?.mirror) {
        videoEl.style.transform = ''
      }
      this.clients = Math.max(0, this.clients - 1)
      if (this.clients === 0) {
        this.stop()
      }
    }
    return release
  }

  stop(): void {
    if (!this.stream) return
    this.stream.getTracks().forEach((t) => t.stop())
    this.stream = null
  }
}

const singleton = new CameraManager()

export function useCameraManager() {
  return singleton
}
