export interface UserAgentInfo {
  browser: string;
  os: string;
  device: string;
}

export function parseUserAgent(userAgent: string | null | undefined): UserAgentInfo {
  if (!userAgent) {
    return { browser: 'Unknown Browser', os: 'Unknown OS', device: 'Unknown' };
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'PC';

  // Parse browser
  if (userAgent.includes('Edg/')) {
    browser = 'Edge';
  } else if (userAgent.includes('Brave')) {
    browser = 'Brave';
  } else if (userAgent.includes('OPR/')) {
    browser = 'Opera';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  }

  // Parse OS
  if (userAgent.includes('Windows NT')) {
    os = 'Windows';
  } else if (userAgent.includes('iPad')) {
    os = 'iPadOS';
    device = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iOS')) {
    os = 'iOS';
    device = 'Mobile';
  } else if (userAgent.includes('Mac OS X')) {
    const isTouchDevice = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
    os = isTouchDevice ? 'iPadOS' : 'macOS';
    if (isTouchDevice) device = 'Mobile';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  // Additional mobile detection
  if (userAgent.includes('Mobile') && device === 'PC') {
    device = 'Mobile';
  }

  return { browser, os, device };
}
