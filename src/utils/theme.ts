type ThemeChangeDetail = { dark?: boolean };

export function setDarkMode(darkMode: boolean): void {
  if (darkMode) {
    document.documentElement.classList.add(
      'dark',
      'custom-scroll',
      'custom-scroll-thumb1'
    );
  } else {
    document.documentElement.classList.remove('dark');
  }

  localStorage.setItem('contrabooks-theme', darkMode ? 'dark' : 'light');
}

if (typeof window !== 'undefined') {
  window.addEventListener('contrabooks:theme-change', (event) => {
    const detail = (event as CustomEvent<ThemeChangeDetail>).detail;
    if (typeof detail?.dark === 'boolean') {
      setDarkMode(detail.dark);
    }
  });
}
