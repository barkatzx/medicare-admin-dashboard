export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
}

export function parseDeviceInfo(ua: string): DeviceInfo {
  let browser = "Unknown browser";
  if (/Edg(e|A|iOS)?\//.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/SamsungBrowser\//.test(ua)) browser = "Samsung Internet";
  else if (/Firefox\/|FxiOS\//.test(ua)) browser = "Firefox";
  else if (/Chrome\/|CriOS\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Linux/.test(ua)) os = "Linux";

  let deviceType: DeviceInfo["deviceType"] = "Desktop";
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    deviceType = "Tablet";
  } else if (/Mobi|iPhone|iPod|Android/.test(ua)) {
    deviceType = "Mobile";
  }

  return { browser, os, deviceType };
}
