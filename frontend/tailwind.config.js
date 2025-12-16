/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./lib/**/*.{js,ts,jsx,tsx,mdx}',
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			colors: {
				primary: {
					'50': '#fef1f7',
					'100': '#fee5f0',
					'200': '#fecce3',
					'300': '#ffa3cb',
					'400': '#ff6aac',
					'500': '#f83a8e',
					'600': '#de065d',
					'700': '#c00054',
					'800': '#a1004d',
					'900': '#8c0147',
					'950': '#55002a',
					DEFAULT: 'hsl(var(--primary))',
					dark: '#c00054',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					'50': '#effcf6',
					'100': '#dafeef',
					'200': '#b8f8df',
					'300': '#81edc7',
					'400': '#4ddcab',
					'500': '#2cc193',
					'600': '#1d9d78',
					'700': '#1c7d62',
					'800': '#1c6350',
					'900': '#1a5344',
					'950': '#0a2f27',
					DEFAULT: 'hsl(var(--secondary))',
					dark: '#1c7d62',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			gradientColorStops: {
				'primary-start': '#de065d',
				'primary-end': '#ff6aac'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		require("tailwindcss-animate")
	],
}
