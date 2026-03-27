import signal
import time

from scheduler import start_scheduler, stop_scheduler


_running = True


def _handle_signal(signum, frame):
    global _running
    _running = False


if __name__ == "__main__":
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    start_scheduler()
    try:
        while _running:
            time.sleep(1)
    finally:
        stop_scheduler()
