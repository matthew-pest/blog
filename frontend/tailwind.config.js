/** @type {import('tailwindcss').Config} */
module.exports = { 
	content: [ "./src/**/*.{js,ts,jsx,tsx}" ], 
	theme: { 
		extend: {
			colors: {
				'custom-gray': '#d1d3d4',
			  },
		},
	}, 
	plugins: [], 
}