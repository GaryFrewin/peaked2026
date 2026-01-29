# Quest Wireless Debugging

Help me connect to my Meta Quest for wireless debugging.

## Context

- ADB is at `C:\platform-tools\adb.exe` (not in PATH, use full path)
- Quest IP changes frequently after router restarts
- Debugging happens via `chrome://inspect` in Chrome
- Sometimes chrome://inspect just goes to sleep - try refreshing it first

## Quick Connect (Try This First)

If you know the IP, just run:
```powershell
C:\platform-tools\adb.exe connect <QUEST_IP>:5555
```

Then open `chrome://inspect` in Chrome. If the Quest doesn't appear, **refresh the page** - it sometimes goes to sleep.

## If Connection Fails or IP Changed

1. Plug Quest in via USB
2. Approve "Allow USB debugging?" on Quest headset
3. Enable wireless mode:
   ```powershell
   C:\platform-tools\adb.exe tcpip 5555
   ```
4. Get the new IP:
   ```powershell
   C:\platform-tools\adb.exe shell ip -4 addr show wlan0
   ```
   Look for `inet 192.168.x.x` - that's the Quest IP
5. Unplug USB and connect wirelessly:
   ```powershell
   C:\platform-tools\adb.exe connect <NEW_IP>:5555
   ```

## Useful Commands

```powershell
C:\platform-tools\adb.exe devices           # List connected devices
C:\platform-tools\adb.exe connect <ip>:5555 # Connect wirelessly  
C:\platform-tools\adb.exe disconnect        # Disconnect all wireless
C:\platform-tools\adb.exe kill-server       # Restart ADB if acting up
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| chrome://inspect shows nothing | **Refresh the page** - it goes to sleep |
| "unauthorized" | Check Quest for approval dialog |
| "failed to authenticate" | Approve new wireless auth on Quest |
| "connection refused" | Quest not in TCP mode - need USB to run `adb tcpip 5555` |
| Can't find Quest IP | Use USB + `adb shell ip -4 addr show wlan0` |
