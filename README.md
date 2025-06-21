# Sage BG - TypeScript Node.js Project

A Node.js project set up with TypeScript for type-safe development.

## Features

- TypeScript configuration with strict type checking
- Development server with hot reload using nodemon
- Build process with source maps and declaration files
- Modern ES2020 target

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Or use the watch mode for TypeScript compilation
npm run watch
```

### Building

```bash
# Build the project
npm run build

# Clean build artifacts
npm run clean
```

### Production

```bash
# Build and start production server
npm run build
npm start
```

## Project Structure

```
sage_bg/
├── src/           # TypeScript source files
│   └── index.ts   # Main entry point
├── dist/          # Compiled JavaScript (generated)
├── tsconfig.json  # TypeScript configuration
├── nodemon.json   # Nodemon configuration
└── package.json   # Project dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled JavaScript
- `npm run watch` - Watch for changes and recompile
- `npm run clean` - Remove build artifacts

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- ES2020 target
- CommonJS modules
- Source maps enabled
- Declaration files generated
- Strict null checks
- No implicit any

## License

ISC 