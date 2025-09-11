# 🔌 CircuitPilot - 930 Wire Plotting Tool

> **A modern, interactive circuit diagram editor designed for FRC robotics teams**

CircuitPilot is a powerful desktop application built specifically for creating, editing, and managing electrical wiring diagrams for robotics projects. With an intuitive drag-and-drop interface and intelligent wire routing, it streamlines the process of documenting complex electrical systems.

![CircuitPilot Interface](https://img.shields.io/badge/Platform-Electron-blue?logo=electron)
![Tech Stack](https://img.shields.io/badge/Built%20with-React%20%7C%20TypeScript%20%7C%20Vite-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

###  **Smart Circuit Design**
- **Component Library**: Pre-loaded with common robotics components (motors, sensors, controllers)
- **Drag & Drop Interface**: Intuitive component placement with grid snapping
- **Intelligent Wire Routing**: Automatic pathfinding with obstacle avoidance using KiCad-style algorithms
- **Wire Pairing**: Support for paired wires (power+/-, CAN H/L, signal differential pairs)

###  **Professional Tools**
- **Multiple Wire Types**: Power, signal, CAN bus, Ethernet, USB with color coding
- **Wire Gauges**: Support for standard AWG wire sizes (10-22 gauge)
- **Custom Control Points**: Manual wire routing with user-defined waypoints
- **Component Rotation**: 90-degree rotation support for optimal layout

###  **File Management**
- **Project Export**: Save/load project files with full diagram state
- **PDF Export**: Generate professional documentation
- **PNG Export**: High-quality images for presentations
- **Auto-validation**: Real-time error checking and wire cleanup

###  **Modern UI/UX**
- **Dark/Light Themes**: Customizable appearance
- **Responsive Design**: Works on various screen sizes
- **Keyboard Shortcuts**: Efficient workflow navigation
- **Real-time Preview**: See changes instantly as you work

##  Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AsherVerLee/930-Wire-Plotting-tool.git
   cd 930-Wire-Plotting-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Launch Electron app** (in a new terminal)
   ```bash
   npm run electron:dev
   # or
   bun run electron:dev
   ```

### Building for Production

```bash
# Build the web application
npm run build

# Package as desktop app
npm run make
```

## Development

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Desktop**: Electron with Forge
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Project Structure

```
src/
├── components/           # Reusable UI components
├── features/
│   └── diagram/         # Circuit diagram functionality
│       ├── components/  # Canvas, Toolbar, Palette, etc.
│       └── parts/       # Component library definitions
├── state/               # Zustand stores
├── utils/               # Routing algorithms, validation, export
├── types/               # TypeScript type definitions
└── pages/               # Application pages
```

### Key Components

- **DiagramCanvas**: Main SVG-based drawing surface with pan/zoom
- **Palette**: Component library browser with search
- **Toolbar**: File operations, export, and editing tools
- **PropertiesPanel**: Component and wire property editor
- **SettingsPanel**: Application preferences and routing configuration

##  Usage Guide

### Basic Workflow

1. **Add Components**: Drag components from the palette to the canvas
2. **Connect Wires**: Click on terminals to start wire connections
3. **Route Wires**: Add control points for custom wire paths
4. **Validate**: Use auto-cleanup tools to optimize wire routing
5. **Export**: Save your diagram or export to PDF/PNG

### Wire Routing Features

- **Automatic Routing**: Smart pathfinding around obstacles
- **Manual Control**: Add waypoints for precise routing
- **Wire Pairing**: Automatic paired wire management for differential signals
- **Collision Avoidance**: Prevents wire overlaps and component conflicts

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save project
- `Ctrl/Cmd + O`: Open project
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Delete`: Remove selected components/wires
- `R`: Rotate selected component

##  Contributing

We welcome contributions from the FRC community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Write tests for new features
- Update documentation as needed

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- **Team 930**: The Mukwonago Bears robotics team
- **FRC Community**: For inspiration and feedback
- **Open Source Libraries**: React, Electron, and the amazing ecosystem

##  Support

- **Issues**: [GitHub Issues](https://github.com/AsherVerLee/930-Wire-Plotting-tool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AsherVerLee/930-Wire-Plotting-tool/discussions)
- **Team Contact**: [team930@example.com](mailto:team930@example.com)

---

**Built with ❤️ for the FRC community by Team 930**
