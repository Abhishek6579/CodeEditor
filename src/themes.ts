export type ThemeId = "default" | "catppuccin" | "tokyo-night" | "github-dark" | "dracula" | "one-dark-pro" | "one-monokai" | "ayu-dark" | "nord" | "gruvbox-dark";

export type EditorTheme = {
  name: string;
  description: string;
  colors: {
    bg: string; panel: string; panelAlt: string; editor: string; terminal: string;
    border: string; text: string; muted: string; subtle: string; accent: string;
    accentAlt: string; hover: string; selection: string; activeLine: string;
    gutter: string; gutterActive: string; cursor: string;
  };
  syntax: {
    comment: string; string: string; number: string; keyword: string;
    function: string; definition: string; constant: string; type: string;
    property: string; operator: string; tag: string; regexp: string;
  };
  terminal: Record<string, string>;
};

const makeTheme = (
  name: string, description: string, colors: EditorTheme["colors"],
  syntax: EditorTheme["syntax"], ansi: string[]
): EditorTheme => ({
  name, description, colors, syntax,
  terminal: {
    background: colors.terminal, foreground: colors.text, cursor: colors.cursor,
    cursorAccent: colors.terminal, selectionBackground: colors.selection,
    black: ansi[0], red: ansi[1], green: ansi[2], yellow: ansi[3],
    blue: ansi[4], magenta: ansi[5], cyan: ansi[6], white: ansi[7],
    brightBlack: ansi[8], brightRed: ansi[9], brightGreen: ansi[10],
    brightYellow: ansi[11], brightBlue: ansi[12], brightMagenta: ansi[13],
    brightCyan: ansi[14], brightWhite: ansi[15]
  }
});

const themePresets: Record<Exclude<ThemeId, "default">, EditorTheme> = {
  "catppuccin": makeTheme("Catppuccin Mocha", "Soothing pastel dark theme", {
    bg:"#1e1e2e", panel:"#181825", panelAlt:"#11111b", editor:"#1e1e2e", terminal:"#11111b",
    border:"#313244", text:"#cdd6f4", muted:"#a6adc8", subtle:"#6c7086", accent:"#b4befe",
    accentAlt:"#cba6f7", hover:"#242438", selection:"#45475a", activeLine:"#242438",
    gutter:"#181825", gutterActive:"#313244", cursor:"#f5e0dc"
  }, {
    comment:"#6c7086", string:"#a6e3a1", number:"#fab387", keyword:"#cba6f7",
    function:"#89b4fa", definition:"#cba6f7", constant:"#fab387", type:"#f9e2af",
    property:"#89dceb", operator:"#94e2d5", tag:"#f38ba8", regexp:"#f5c2e7"
  }, ["#45475a","#f38ba8","#a6e3a1","#f9e2af","#89b4fa","#cba6f7","#89dceb","#bac2de","#585b70","#f38ba8","#a6e3a1","#f9e2af","#89b4fa","#cba6f7","#89dceb","#a6adc8"]),
  "tokyo-night": makeTheme("Tokyo Night Storm", "Cool indigo with electric blue accents", {
    bg:"#24283b", panel:"#1f2335", panelAlt:"#1a1b26", editor:"#24283b", terminal:"#1a1b26",
    border:"#3b4261", text:"#c0caf5", muted:"#a9b1d6", subtle:"#565f89", accent:"#7aa2f7",
    accentAlt:"#bb9af7", hover:"#292e42", selection:"#3d59a1", activeLine:"#292e42",
    gutter:"#1f2335", gutterActive:"#3b4261", cursor:"#c0caf5"
  }, {
    comment:"#565f89", string:"#9ece6a", number:"#ff9e64", keyword:"#bb9af7",
    function:"#7aa2f7", definition:"#7dcfff", constant:"#ff9e64", type:"#2ac3de",
    property:"#7dcfff", operator:"#89ddff", tag:"#f7768e", regexp:"#b4f9f8"
  }, ["#414868","#f7768e","#9ece6a","#e0af68","#7aa2f7","#bb9af7","#7dcfff","#a9b1d6","#565f89","#f7768e","#9ece6a","#e0af68","#7aa2f7","#bb9af7","#7dcfff","#c0caf5"]),
  "github-dark": makeTheme("GitHub Dark", "GitHub's neutral dark palette", {
    bg:"#0d1117", panel:"#161b22", panelAlt:"#010409", editor:"#0d1117", terminal:"#010409",
    border:"#30363d", text:"#e6edf3", muted:"#8b949e", subtle:"#6e7681", accent:"#2f81f7",
    accentAlt:"#a371f7", hover:"#21262d", selection:"#264f78", activeLine:"#161b22",
    gutter:"#161b22", gutterActive:"#30363d", cursor:"#e6edf3"
  }, {
    comment:"#8b949e", string:"#a5d6ff", number:"#79c0ff", keyword:"#ff7b72",
    function:"#d2a8ff", definition:"#ffa657", constant:"#79c0ff", type:"#ffa657",
    property:"#7ee787", operator:"#ff7b72", tag:"#7ee787", regexp:"#a5d6ff"
  }, ["#484f58","#ff7b72","#3fb950","#d29922","#58a6ff","#bc8cff","#39c5cf","#b1bac4","#6e7681","#ffa198","#56d364","#e3b341","#79c0ff","#d2a8ff","#56d4dd","#f0f6fc"]),
  "dracula": makeTheme("Dracula", "High-contrast purple dark theme", {
    bg:"#282a36", panel:"#21222c", panelAlt:"#191a21", editor:"#282a36", terminal:"#191a21",
    border:"#44475a", text:"#f8f8f2", muted:"#bfbfbf", subtle:"#6272a4", accent:"#bd93f9",
    accentAlt:"#ff79c6", hover:"#343746", selection:"#44475a", activeLine:"#343746",
    gutter:"#21222c", gutterActive:"#44475a", cursor:"#f8f8f2"
  }, {
    comment:"#6272a4", string:"#f1fa8c", number:"#bd93f9", keyword:"#ff79c6",
    function:"#50fa7b", definition:"#8be9fd", constant:"#bd93f9", type:"#8be9fd",
    property:"#50fa7b", operator:"#ff79c6", tag:"#ff79c6", regexp:"#f1fa8c"
  }, ["#21222c","#ff5555","#50fa7b","#f1fa8c","#bd93f9","#ff79c6","#8be9fd","#f8f8f2","#6272a4","#ff6e6e","#69ff94","#ffffa5","#d6acff","#ff92df","#a4ffff","#ffffff"]),
  "one-dark-pro": makeTheme("One Dark Pro", "Balanced Atom-inspired dark palette", {
    bg:"#282c34", panel:"#21252b", panelAlt:"#1b1f24", editor:"#282c34", terminal:"#1b1f24",
    border:"#3e4451", text:"#abb2bf", muted:"#9da5b4", subtle:"#5c6370", accent:"#61afef",
    accentAlt:"#c678dd", hover:"#2c313a", selection:"#3e4451", activeLine:"#2c313a",
    gutter:"#21252b", gutterActive:"#3e4451", cursor:"#528bff"
  }, {
    comment:"#5c6370", string:"#98c379", number:"#d19a66", keyword:"#c678dd",
    function:"#61afef", definition:"#e06c75", constant:"#d19a66", type:"#e5c07b",
    property:"#e06c75", operator:"#56b6c2", tag:"#e06c75", regexp:"#56b6c2"
  }, ["#5c6370","#e06c75","#98c379","#e5c07b","#61afef","#c678dd","#56b6c2","#abb2bf","#4b5263","#be5046","#98c379","#d19a66","#61afef","#c678dd","#56b6c2","#ffffff"]),
  "one-monokai": makeTheme("One Monokai", "Vibrant Monokai colors on charcoal", {
    bg:"#282c34", panel:"#21252b", panelAlt:"#1b1f24", editor:"#282c34", terminal:"#1b1f24",
    border:"#3e4451", text:"#d7dae0", muted:"#abb2bf", subtle:"#5c6370", accent:"#61afef",
    accentAlt:"#c678dd", hover:"#2c313a", selection:"#3e4451", activeLine:"#2c313a",
    gutter:"#21252b", gutterActive:"#3e4451", cursor:"#f8f8f0"
  }, {
    comment:"#7f848e", string:"#e5c07b", number:"#ae81ff", keyword:"#c678dd",
    function:"#61afef", definition:"#f92672", constant:"#ae81ff", type:"#a6e22e",
    property:"#fd971f", operator:"#f92672", tag:"#f92672", regexp:"#e6db74"
  }, ["#272822","#f92672","#a6e22e","#e6db74","#66d9ef","#ae81ff","#66d9ef","#f8f8f2","#75715e","#f92672","#a6e22e","#e6db74","#66d9ef","#ae81ff","#66d9ef","#f9f8f5"]),
  "ayu-dark": makeTheme("Ayu Dark", "Muted dark background with warm accents", {
    bg:"#0b0e14", panel:"#0f131a", panelAlt:"#07090d", editor:"#0b0e14", terminal:"#07090d",
    border:"#2d333b", text:"#bfbdb6", muted:"#8a9199", subtle:"#565b66", accent:"#e6b450",
    accentAlt:"#d2a6ff", hover:"#151a22", selection:"#273747", activeLine:"#151a22",
    gutter:"#0f131a", gutterActive:"#2d333b", cursor:"#e6b450"
  }, {
    comment:"#5c6773", string:"#aad94c", number:"#ffb454", keyword:"#ff8f40",
    function:"#ffb454", definition:"#59c2ff", constant:"#d2a6ff", type:"#59c2ff",
    property:"#39bae6", operator:"#f29668", tag:"#f07178", regexp:"#95e6cb"
  }, ["#131721","#f07178","#aad94c","#e6b450","#59c2ff","#d2a6ff","#95e6cb","#bfbdb6","#565b66","#f07178","#c2d94c","#ffb454","#73d0ff","#dfbfff","#95e6cb","#f3f4f5"]),
  "nord": makeTheme("Nord", "Arctic blue-grey palette with restrained contrast", {
    bg:"#2e3440", panel:"#272c36", panelAlt:"#242933", editor:"#2e3440", terminal:"#242933",
    border:"#434c5e", text:"#eceff4", muted:"#d8dee9", subtle:"#7b88a1", accent:"#88c0d0",
    accentAlt:"#b48ead", hover:"#3b4252", selection:"#434c5e", activeLine:"#353c4a",
    gutter:"#272c36", gutterActive:"#434c5e", cursor:"#d8dee9"
  }, {
    comment:"#7b88a1", string:"#a3be8c", number:"#b48ead", keyword:"#81a1c1",
    function:"#88c0d0", definition:"#8fbcbb", constant:"#d08770", type:"#8fbcbb",
    property:"#88c0d0", operator:"#81a1c1", tag:"#bf616a", regexp:"#a3be8c"
  }, ["#3b4252","#bf616a","#a3be8c","#ebcb8b","#81a1c1","#b48ead","#88c0d0","#e5e9f0","#4c566a","#bf616a","#a3be8c","#ebcb8b","#81a1c1","#b48ead","#8fbcbb","#eceff4"]),
  "gruvbox-dark": makeTheme("Gruvbox Dark", "Warm retro dark palette with earthy syntax colors", {
    bg:"#282828", panel:"#1d2021", panelAlt:"#1d2021", editor:"#282828", terminal:"#1d2021",
    border:"#504945", text:"#ebdbb2", muted:"#d5c4a1", subtle:"#928374", accent:"#fabd2f",
    accentAlt:"#d3869b", hover:"#3c3836", selection:"#504945", activeLine:"#32302f",
    gutter:"#1d2021", gutterActive:"#504945", cursor:"#ebdbb2"
  }, {
    comment:"#928374", string:"#b8bb26", number:"#d3869b", keyword:"#fb4934",
    function:"#fabd2f", definition:"#8ec07c", constant:"#d3869b", type:"#83a598",
    property:"#8ec07c", operator:"#fe8019", tag:"#fb4934", regexp:"#b8bb26"
  }, ["#282828","#cc241d","#98971a","#d79921","#458588","#b16286","#689d6a","#a89984","#928374","#fb4934","#b8bb26","#fabd2f","#83a598","#d3869b","#8ec07c","#ebdbb2"])
};

// "Default" preserves Milize's original Catppuccin Mocha appearance.
export const themes: Record<ThemeId, EditorTheme> = {
  ...themePresets,
  default: {
    ...themePresets.catppuccin,
    name: "Default",
    description: "Milize's original dark appearance"
  }
};

export const themeIds = ["default", ...Object.keys(themePresets)] as ThemeId[];
