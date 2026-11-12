#!/usr/bin/env node
// 生成物。手で編集しない。正本は .kit/src/packages/design（pnpm --filter design build で作り直す）

// cli/theme.ts
import { fileURLToPath } from "node:url";

// tokens.json
var tokens_default = {
  $description: "vault \u306E UI \u306E\u30C7\u30B6\u30A4\u30F3\u30C8\u30FC\u30AF\u30F3\uFF08Design Tokens Format Module 2025.10\uFF09\u3002\u3053\u308C\u304C\u6B63\u672C\u3002\u751F\u6210\u7269\u306F pnpm --filter design build \u3067\u4F5C\u308B",
  color: {
    $type: "color",
    $description: "\u8272\u3002\u5024\u306F\u30E9\u30A4\u30C8\u3001\u30C0\u30FC\u30AF\u306F $extensions \u306B\u7F6E\u304F",
    surface: {
      $value: { colorSpace: "srgb", components: [0.9647, 0.9608, 0.949], hex: "#f6f5f2" },
      $description: "\u57FA\u672C\u306E\u9762\u3002Obsidian \u306E\u30A8\u30C7\u30A3\u30BF\u306E\u80CC\u666F\u3068\u540C\u3058\u306B\u3059\u308B",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.1176, 0.1176, 0.1176], hex: "#1e1e1e" },
          obsidian: ["--background-primary"],
          source: "\u76EE\u306B\u512A\u3057\u304F\u3059\u308B\u305F\u3081\u7D14\u767D\u3092\u907F\u3051\u3001\u3054\u304F\u308F\u305A\u304B\u306B\u6696\u304B\u3044\u767D\u306B\u3059\u308B\uFF08ADR-0019\uFF09",
          vault: true
        }
      }
    },
    "surface-container": {
      $value: { colorSpace: "srgb", components: [0.9373, 0.9333, 0.9176], hex: "#efeeea" },
      $description: "\u30AB\u30FC\u30C9\u306E\u9762\uFF08surface \u3088\u308A\u4E00\u6BB5\u6FC3\u3044\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.1412, 0.1412, 0.1412], hex: "#242424" },
          obsidian: ["--background-secondary"],
          source: "M3 surface-container",
          vault: true
        }
      }
    },
    "surface-container-high": {
      $value: { colorSpace: "srgb", components: [0.9098, 0.9059, 0.8863], hex: "#e8e7e2" },
      $description: "\u4E00\u6BB5\u5F37\u3044\u9762\uFF08\u65E5\u4ED8\u30D6\u30ED\u30C3\u30AF\u3001\u95A2\u4FC2\u306E\u30C1\u30C3\u30D7\u3001\u4EF6\u6570\u3001\u30CE\u30FC\u30C8\u306E\u30B3\u30FC\u30C9\uFF09\uFF08surface-container \u3088\u308A\u4E00\u6BB5\u6FC3\u3044\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.1686, 0.1686, 0.1686], hex: "#2b2b2b" },
          obsidian: ["--code-background"],
          source: "M3 surface-container-high\u3002\u30CE\u30FC\u30C8\u306E\u30B3\u30FC\u30C9\u306F\u3001Obsidian \u306E\u65E2\u5B9A\u306E\u307E\u307E\u3060\u3068\u672C\u6587\u306E\u9762\u3068\u307B\u307C\u540C\u3058\u8272\uFF08\u30E9\u30A4\u30C8\u3067\u306F\u672C\u6587\u3088\u308A\u660E\u308B\u3044\uFF09\u306B\u306A\u308B\u306E\u3067\u3001\u3053\u306E\u9762\u306B\u56FA\u5B9A\u3059\u308B",
          vault: true
        }
      }
    },
    "on-surface": {
      $value: { colorSpace: "srgb", components: [0.1686, 0.1647, 0.1569], hex: "#2b2a28" },
      $description: "\u672C\u6587\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.8157, 0.8157, 0.8157], hex: "#d0d0d0" },
          contrast: {
            min: 7,
            on: [
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}",
              ["{color.surface}", "{color.state-hover}"],
              ["{color.surface-container}", "{color.state-hover}"],
              ["{color.surface-container-high}", "{color.state-hover}"],
              "{color.secondary-container}"
            ]
          },
          obsidian: ["--text-normal"],
          source: "M3 on-surface\uFF08\u6A19\u6E96\u306E\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u3067 7:1\uFF09",
          vault: true
        }
      }
    },
    "on-surface-variant": {
      $value: { colorSpace: "srgb", components: [0.3412, 0.3373, 0.3098], hex: "#57564f" },
      $description: "\u88DC\u52A9\u306E\u6587\u5B57\u3001\u30E9\u30D9\u30EB\u3001\u30A2\u30A4\u30B3\u30F3\u3001\u672A\u5165\u529B\u306E\u8868\u793A",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.702, 0.702, 0.702], hex: "#b3b3b3" },
          contrast: {
            min: 4.5,
            on: [
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}",
              ["{color.surface}", "{color.state-hover}"],
              ["{color.surface-container}", "{color.state-hover}"],
              ["{color.surface-container-high}", "{color.state-hover}"],
              "{color.secondary-container}"
            ]
          },
          obsidian: ["--text-muted"],
          source: "M3 on-surface-variant",
          vault: true
        }
      }
    },
    outline: {
      $value: { colorSpace: "srgb", components: [0.498, 0.4941, 0.4627], hex: "#7f7e76" },
      $description: "\u7DE8\u96C6\u3067\u304D\u308B\u3082\u306E\u306E\u67A0\u7DDA",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.4784, 0.4784, 0.4784], hex: "#7a7a7a" },
          contrast: {
            min: 3,
            on: ["{color.surface}", "{color.surface-container}", "{color.surface-container-high}"]
          },
          source: "M3 outline\uFF083:1\uFF09",
          vault: true
        }
      }
    },
    "outline-variant": {
      $value: {
        colorSpace: "srgb",
        components: [0.1686, 0.1647, 0.1569],
        alpha: 0.1412,
        hex: "#2b2a28"
      },
      $description: "\u30AB\u30FC\u30C9\u30FB\u30EA\u30B9\u30C8\u30FB\u533A\u5207\u308A\u7DDA\u306E\u67A0\uFF08\u98FE\u308A\u3002\u9762\u306E\u9055\u3044\u3067\u3082\u898B\u5206\u3051\u3089\u308C\u308B\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "decorative",
          dark: {
            colorSpace: "srgb",
            components: [0.8157, 0.8157, 0.8157],
            alpha: 0.1412,
            hex: "#d0d0d0"
          },
          source: "M3 outline-variant",
          derive: "{color.on-surface}"
        }
      }
    },
    "state-hover": {
      $value: {
        colorSpace: "srgb",
        components: [0.1686, 0.1647, 0.1569],
        alpha: 0.0784,
        hex: "#2b2a28"
      },
      $description: "\u30DB\u30D0\u30FC\u3067\u91CD\u306D\u308B\u8272\uFF08on-surface \u306E 8%\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "state",
          dark: {
            colorSpace: "srgb",
            components: [0.8157, 0.8157, 0.8157],
            alpha: 0.0784,
            hex: "#d0d0d0"
          },
          source: "M3 hover state layer 0.08",
          derive: "{color.on-surface}"
        }
      }
    },
    "state-press": {
      $value: {
        colorSpace: "srgb",
        components: [0.1686, 0.1647, 0.1569],
        alpha: 0.1216,
        hex: "#2b2a28"
      },
      $description: "\u62BC\u3057\u305F\u3068\u304D\u306B\u91CD\u306D\u308B\u8272\uFF08on-surface \u306E 12%\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "state",
          dark: {
            colorSpace: "srgb",
            components: [0.8157, 0.8157, 0.8157],
            alpha: 0.1216,
            hex: "#d0d0d0"
          },
          source: "M3 pressed state layer 0.12",
          derive: "{color.on-surface}"
        }
      }
    },
    primary: {
      $value: { colorSpace: "srgb", components: [0.4039, 0.3137, 0.6431], hex: "#6750a4" },
      $description: "\u30A2\u30AF\u30BB\u30F3\u30C8\uFF08\u4ECA\u306E\u30DA\u30FC\u30B8\u3001\u30C6\u30AD\u30B9\u30C8\u30DC\u30BF\u30F3\u3001\u30EA\u30F3\u30AF\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.8157, 0.7373, 1], hex: "#d0bcff" },
          contrast: {
            min: 4.5,
            on: [
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}",
              ["{color.surface}", "{color.state-hover}"],
              ["{color.surface-container}", "{color.state-hover}"],
              ["{color.surface-container-high}", "{color.state-hover}"],
              "{color.secondary-container}"
            ]
          },
          obsidian: ["--interactive-accent", "--text-accent", "--color-accent"],
          source: "M3 baseline primary",
          vault: true
        }
      }
    },
    "on-primary": {
      $value: { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" },
      $description: "primary \u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.2196, 0.1176, 0.4471], hex: "#381e72" },
          contrast: {
            min: 4.5,
            on: ["{color.primary}", ["{color.primary}", "{color.on-primary-state-hover}"]]
          },
          obsidian: ["--text-on-accent"],
          source: "M3 baseline on-primary",
          vault: true,
          follow: { from: "{color.primary}", rule: "on-color" }
        }
      }
    },
    "primary-state-hover": {
      $value: {
        colorSpace: "srgb",
        components: [0.4039, 0.3137, 0.6431],
        alpha: 0.0784,
        hex: "#6750a4"
      },
      $description: "\u30C6\u30AD\u30B9\u30C8\u30DC\u30BF\u30F3\u306E\u30DB\u30D0\u30FC\uFF08primary \u306E 8%\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "state",
          dark: { colorSpace: "srgb", components: [0.8157, 0.7373, 1], alpha: 0.0784, hex: "#d0bcff" },
          source: "M3 hover state layer 0.08",
          derive: "{color.primary}"
        }
      }
    },
    "on-primary-state-hover": {
      $value: { colorSpace: "srgb", components: [1, 1, 1], alpha: 0.0784, hex: "#ffffff" },
      $description: "filled \u30DC\u30BF\u30F3\u306E\u30DB\u30D0\u30FC\uFF08on-primary \u306E 8% \u3092 primary \u306B\u91CD\u306D\u308B\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "state",
          dark: {
            colorSpace: "srgb",
            components: [0.2196, 0.1176, 0.4471],
            alpha: 0.0784,
            hex: "#381e72"
          },
          source: "M3 hover state layer 0.08",
          derive: "{color.on-primary}"
        }
      }
    },
    "secondary-container": {
      $value: { colorSpace: "srgb", components: [0.9098, 0.8706, 0.9725], hex: "#e8def8" },
      $description: "\u9078\u3093\u3067\u3044\u308B\u3082\u306E\u306E\u9762\uFF08\u9078\u3093\u3060\u884C\u3001on \u306E\u7D5E\u308A\u8FBC\u307F\u30C1\u30C3\u30D7\u3001\u4ECA\u306E\u6BB5\u968E\u3001\u30AB\u30FC\u30C9\u3092\u843D\u3068\u305B\u308B\u30B0\u30EB\u30FC\u30D7\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.2392, 0.2157, 0.2863], hex: "#3d3749" },
          source: "M3 baseline secondary-container\u3002\u30C0\u30FC\u30AF\u306F M3 \u306E #4a4458 \u3067\u306F\u6587\u5B57\u304C 7:1 \u306B\u5C4A\u304B\u306A\u3044\u306E\u3067\u6697\u304F\u3057\u305F",
          vault: true,
          follow: { from: "{color.primary}", rule: "container" }
        }
      }
    },
    "on-secondary-container": {
      $value: { colorSpace: "srgb", components: [0.1137, 0.098, 0.1686], hex: "#1d192b" },
      $description: "secondary-container \u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.9098, 0.8706, 0.9725], hex: "#e8def8" },
          contrast: {
            min: 4.5,
            on: ["{color.secondary-container}", ["{color.secondary-container}", "{color.state-hover}"]]
          },
          source: "M3 baseline on-secondary-container",
          vault: true,
          follow: { from: "{color.primary}", rule: "on-container" }
        }
      }
    },
    error: {
      $value: { colorSpace: "srgb", components: [0.702, 0.149, 0.1176], hex: "#b3261e" },
      $description: "\u30A8\u30E9\u30FC\u306E\u6587\u5B57\u3001\u524A\u9664\u30DC\u30BF\u30F3",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.949, 0.7216, 0.7098], hex: "#f2b8b5" },
          contrast: {
            min: 4.5,
            on: ["{color.surface}", "{color.surface-container}", "{color.surface-container-high}"]
          },
          obsidian: ["--text-error"],
          source: "M3 baseline error"
        }
      }
    },
    "focus-ring": {
      $value: "{color.primary}",
      $description: "\u30AD\u30FC\u30DC\u30FC\u30C9\u3067\u9078\u3093\u3060\u3068\u304D\u306E\u67A0",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          contrast: {
            min: 3,
            on: ["{color.surface}", "{color.surface-container}", "{color.surface-container-high}"]
          }
        }
      }
    },
    "text-faint": {
      $value: { colorSpace: "srgb", components: [0.4118, 0.4078, 0.3765], hex: "#696860" },
      $description: "Obsidian \u672C\u4F53\u306E\u8584\u3044\u6587\u5B57\u3002\u30D7\u30E9\u30B0\u30A4\u30F3\u3067\u306F\u4F7F\u308F\u306A\u3044\uFF08\u6A19\u6E96\u306E\u5024\u306F 4.5:1 \u306B\u5C4A\u304B\u306A\u3044\u306E\u3067\u4E0A\u3052\u308B\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.5804, 0.5804, 0.5804], hex: "#949494" },
          contrast: { min: 4.5, on: ["{color.surface}", "{color.surface-container-high}"] },
          obsidian: ["--text-faint"],
          plugin: false,
          source: "WCAG 1.4.3\u3002\u30CE\u30FC\u30C8\u306E\u30B3\u30FC\u30C9\u306E\u9762\uFF08surface-container-high\uFF09\u306B\u3082\u8F09\u308B\u306E\u3067\u3001\u30C0\u30FC\u30AF\u306F\u305D\u306E\u9762\u3067 4.5:1 \u306B\u306A\u308B\u307E\u3067\u4E0A\u3052\u308B",
          vault: true
        }
      }
    },
    "green-container": {
      $value: { colorSpace: "srgb", components: [0.7686, 0.9333, 0.8157], hex: "#c4eed0" },
      $description: "green \u306E\u9762\uFF08open\u3001\u5B9F\u884C\u65E5\u3001\u8A18\u9332\u4E2D\u306E worklog\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.0588, 0.3216, 0.1373], hex: "#0f5223" }
        }
      }
    },
    "on-green-container": {
      $value: { colorSpace: "srgb", components: [0.0275, 0.1529, 0.0667], hex: "#072711" },
      $description: "green \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.7686, 0.9333, 0.8157], hex: "#c4eed0" },
          contrast: {
            min: 4.5,
            on: ["{color.green-container}", ["{color.green-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    green: {
      $value: { colorSpace: "srgb", components: [0.1176, 0.5569, 0.2431], hex: "#1e8e3e" },
      $description: "green \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.4275, 0.8353, 0.549], hex: "#6dd58c" },
          contrast: {
            min: 3,
            on: [
              "{color.green-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "blue-container": {
      $value: { colorSpace: "srgb", components: [0.8275, 0.8902, 0.9922], hex: "#d3e3fd" },
      $description: "blue \u306E\u9762\uFF08in-progress\u3001worklog \u306E\u4F5C\u696D\u6642\u9593\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.0314, 0.2588, 0.6275], hex: "#0842a0" }
        }
      }
    },
    "on-blue-container": {
      $value: { colorSpace: "srgb", components: [0.0157, 0.1176, 0.2863], hex: "#041e49" },
      $description: "blue \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.8275, 0.8902, 0.9922], hex: "#d3e3fd" },
          contrast: {
            min: 4.5,
            on: ["{color.blue-container}", ["{color.blue-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    blue: {
      $value: { colorSpace: "srgb", components: [0.0431, 0.3412, 0.8157], hex: "#0b57d0" },
      $description: "blue \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.6588, 0.7804, 0.9804], hex: "#a8c7fa" },
          contrast: {
            min: 3,
            on: [
              "{color.blue-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "purple-container": {
      $value: { colorSpace: "srgb", components: [0.9176, 0.8667, 1], hex: "#eaddff" },
      $description: "purple \u306E\u9762\uFF08closed\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.3098, 0.2157, 0.5451], hex: "#4f378b" }
        }
      }
    },
    "on-purple-container": {
      $value: { colorSpace: "srgb", components: [0.1294, 0, 0.3647], hex: "#21005d" },
      $description: "purple \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.9176, 0.8667, 1], hex: "#eaddff" },
          contrast: {
            min: 4.5,
            on: ["{color.purple-container}", ["{color.purple-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    purple: {
      $value: { colorSpace: "srgb", components: [0.4039, 0.3137, 0.6431], hex: "#6750a4" },
      $description: "purple \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.8157, 0.7373, 1], hex: "#d0bcff" },
          contrast: {
            min: 3,
            on: [
              "{color.purple-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "gray-container": {
      $value: { colorSpace: "srgb", components: [0.8902, 0.8902, 0.8902], hex: "#e3e3e3" },
      $description: "gray \u306E\u9762\uFF08canceled\u3001priority \u306E chore\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.2667, 0.2784, 0.2745], hex: "#444746" }
        }
      }
    },
    "on-gray-container": {
      $value: { colorSpace: "srgb", components: [0.1216, 0.1216, 0.1216], hex: "#1f1f1f" },
      $description: "gray \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.8902, 0.8902, 0.8902], hex: "#e3e3e3" },
          contrast: {
            min: 4.5,
            on: ["{color.gray-container}", ["{color.gray-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    gray: {
      $value: { colorSpace: "srgb", components: [0.4549, 0.4667, 0.4588], hex: "#747775" },
      $description: "gray \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.7686, 0.7804, 0.7725], hex: "#c4c7c5" },
          contrast: {
            min: 3,
            on: [
              "{color.gray-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "sky-container": {
      $value: { colorSpace: "srgb", components: [0.7608, 0.9059, 1], hex: "#c2e7ff" },
      $description: "sky \u306E\u9762\uFF08someday\u3001priority \u306E low\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0, 0.2902, 0.4667], hex: "#004a77" }
        }
      }
    },
    "on-sky-container": {
      $value: { colorSpace: "srgb", components: [0, 0.1137, 0.2078], hex: "#001d35" },
      $description: "sky \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.7608, 0.9059, 1], hex: "#c2e7ff" },
          contrast: {
            min: 4.5,
            on: ["{color.sky-container}", ["{color.sky-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    sky: {
      $value: { colorSpace: "srgb", components: [0, 0.3882, 0.6078], hex: "#00639b" },
      $description: "sky \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.498, 0.8118, 1], hex: "#7fcfff" },
          contrast: {
            min: 3,
            on: [
              "{color.sky-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "pink-container": {
      $value: { colorSpace: "srgb", components: [1, 0.8471, 0.8941], hex: "#ffd8e4" },
      $description: "pink \u306E\u9762\uFF08waiting\u3001delegated\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.549, 0.1137, 0.3098], hex: "#8c1d4f" }
        }
      }
    },
    "on-pink-container": {
      $value: { colorSpace: "srgb", components: [0.2431, 0, 0.1137], hex: "#3e001d" },
      $description: "pink \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [1, 0.8471, 0.8941], hex: "#ffd8e4" },
          contrast: {
            min: 4.5,
            on: ["{color.pink-container}", ["{color.pink-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    pink: {
      $value: { colorSpace: "srgb", components: [0.7608, 0.0941, 0.3569], hex: "#c2185b" },
      $description: "pink \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [1, 0.6902, 0.7843], hex: "#ffb0c8" },
          contrast: {
            min: 3,
            on: [
              "{color.pink-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "red-container": {
      $value: { colorSpace: "srgb", components: [0.9765, 0.8706, 0.8627], hex: "#f9dedc" },
      $description: "red \u306E\u9762\uFF08priority \u306E high\u3001deadline \u306E\u67A0\u3001\u671F\u9650\u5207\u308C\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.549, 0.1137, 0.0941], hex: "#8c1d18" }
        }
      }
    },
    "on-red-container": {
      $value: { colorSpace: "srgb", components: [0.2549, 0.0549, 0.0431], hex: "#410e0b" },
      $description: "red \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.9765, 0.8706, 0.8627], hex: "#f9dedc" },
          contrast: {
            min: 4.5,
            on: ["{color.red-container}", ["{color.red-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    red: {
      $value: { colorSpace: "srgb", components: [0.851, 0.1882, 0.1451], hex: "#d93025" },
      $description: "red \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [0.949, 0.7216, 0.7098], hex: "#f2b8b5" },
          contrast: {
            min: 3,
            on: [
              "{color.red-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    "amber-container": {
      $value: { colorSpace: "srgb", components: [1, 0.9255, 0.702], hex: "#ffecb3" },
      $description: "amber \u306E\u9762\uFF08priority \u306E mid\u3001soft_deadline \u306E\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.3608, 0.2627, 0], hex: "#5c4300" }
        }
      }
    },
    "on-amber-container": {
      $value: { colorSpace: "srgb", components: [0.2275, 0.1647, 0], hex: "#3a2a00" },
      $description: "amber \u306E\u9762\u306E\u4E0A\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [1, 0.9255, 0.702], hex: "#ffecb3" },
          contrast: {
            min: 4.5,
            on: ["{color.amber-container}", ["{color.amber-container}", "{color.state-hover}"]]
          }
        }
      }
    },
    amber: {
      $value: { colorSpace: "srgb", components: [0.6902, 0.4275, 0], hex: "#b06d00" },
      $description: "amber \u306E\u5370\uFF08\u70B9\u30FB\u30A2\u30A4\u30B3\u30F3\u30FB\u67A0\uFF09",
      $extensions: {
        "com.yamayu-pkm": {
          role: "graphic",
          dark: { colorSpace: "srgb", components: [1, 0.8353, 0.3098], hex: "#ffd54f" },
          contrast: {
            min: 3,
            on: [
              "{color.amber-container}",
              "{color.surface}",
              "{color.surface-container}",
              "{color.surface-container-high}"
            ]
          }
        }
      }
    },
    scheduled: {
      $value: { colorSpace: "srgb", components: [0.0941, 0.502, 0.2196], hex: "#188038" },
      $description: "\u5B9F\u884C\u65E5\u306E\u9762",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.1804, 0.4902, 0.1961], hex: "#2e7d32" }
        }
      }
    },
    "scheduled-hover": {
      $value: { colorSpace: "srgb", components: [0.0745, 0.451, 0.2], hex: "#137333" },
      $description: "\u5B9F\u884C\u65E5\u306E\u30DB\u30D0\u30FC",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.1608, 0.4314, 0.1725], hex: "#296e2c" }
        }
      }
    },
    "on-scheduled": {
      $value: { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" },
      $description: "\u5B9F\u884C\u65E5\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" },
          contrast: { min: 4.5, on: ["{color.scheduled}", "{color.scheduled-hover}"] }
        }
      }
    },
    "due-3": {
      $value: { colorSpace: "srgb", components: [1, 0.9725, 0.8824], hex: "#fff8e1" },
      $description: "\u671F\u9650\u306E 3 \u65E5\u524D",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.2902, 0.2471, 0.0784], hex: "#4a3f14" }
        }
      }
    },
    "due-2": {
      $value: { colorSpace: "srgb", components: [1, 0.8784, 0.5098], hex: "#ffe082" },
      $description: "\u671F\u9650\u306E 2 \u65E5\u524D",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.4196, 0.3255, 0], hex: "#6b5300" }
        }
      }
    },
    "due-1": {
      $value: { colorSpace: "srgb", components: [1, 0.7176, 0.302], hex: "#ffb74d" },
      $description: "\u671F\u9650\u306E\u524D\u65E5",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.5412, 0.2941, 0], hex: "#8a4b00" }
        }
      }
    },
    "on-due": {
      $value: { colorSpace: "srgb", components: [0.2275, 0.1647, 0], hex: "#3a2a00" },
      $description: "\u671F\u9650\uFF083\u301C1 \u65E5\u524D\uFF09\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [1, 0.9529, 0.8392], hex: "#fff3d6" },
          contrast: {
            min: 4.5,
            on: [
              "{color.due-3}",
              "{color.due-2}",
              "{color.due-1}",
              ["{color.due-3}", "{color.state-hover}"],
              ["{color.due-2}", "{color.state-hover}"],
              ["{color.due-1}", "{color.state-hover}"]
            ]
          }
        }
      }
    },
    "due-0": {
      $value: { colorSpace: "srgb", components: [0.851, 0.1882, 0.1451], hex: "#d93025" },
      $description: "\u671F\u9650\u306E\u5F53\u65E5",
      $extensions: {
        "com.yamayu-pkm": {
          role: "surface",
          dark: { colorSpace: "srgb", components: [0.702, 0.149, 0.1176], hex: "#b3261e" }
        }
      }
    },
    "on-due-0": {
      $value: { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" },
      $description: "\u671F\u9650\u306E\u5F53\u65E5\u306E\u6587\u5B57",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [1, 1, 1], hex: "#ffffff" },
          contrast: { min: 4.5, on: ["{color.due-0}", ["{color.due-0}", "{color.state-hover}"]] }
        }
      }
    },
    "on-label": {
      $value: { colorSpace: "srgb", components: [0.1216, 0.1216, 0.1216], hex: "#1f1f1f" },
      $description: "label \u306E\u6587\u5B57\u3002\u9762\u306F\u30E6\u30FC\u30B6\u30FC\u304C labels.json \u306B\u66F8\u3044\u305F\u8272\u306A\u306E\u3067\u3001task:lint \u3067 4.5:1 \u4EE5\u4E0A\u304B\u3092\u8ABF\u3079\u308B",
      $extensions: {
        "com.yamayu-pkm": {
          role: "text",
          dark: { colorSpace: "srgb", components: [0.1216, 0.1216, 0.1216], hex: "#1f1f1f" },
          contrast: { min: 4.5, on: [] }
        }
      }
    }
  },
  radius: {
    $type: "dimension",
    xs: {
      $value: { value: 4, unit: "px" },
      $description: "\u30EA\u30F3\u30AF\u306E\u30DB\u30D0\u30FC",
      $extensions: { "com.yamayu-pkm": { source: "M3 corner-extra-small" } }
    },
    s: {
      $value: { value: 8, unit: "px" },
      $description: "\u30C1\u30C3\u30D7\u3001\u5165\u529B\u6B04\u3001\u5C0F\u3055\u3044\u30DC\u30BF\u30F3",
      $extensions: { "com.yamayu-pkm": { source: "M3 corner-small" } }
    },
    m: {
      $value: { value: 12, unit: "px" },
      $description: "\u65E5\u4ED8\u306E\u67A0\u3001\u671F\u9650\u3001worklog \u306E\u30AB\u30FC\u30C9",
      $extensions: { "com.yamayu-pkm": { source: "M3 corner-medium" } }
    },
    l: {
      $value: { value: 16, unit: "px" },
      $description: "\u30BB\u30AF\u30B7\u30E7\u30F3\u306E\u30AB\u30FC\u30C9\u3001\u5DE5\u6570\u306E\u30BF\u30A4\u30EB",
      $extensions: { "com.yamayu-pkm": { source: "M3 corner-large" } }
    },
    xl: {
      $value: { value: 28, unit: "px" },
      $description: "Organize \u306E\u30AB\u30FC\u30C9",
      $extensions: { "com.yamayu-pkm": { source: "M3 corner-extra-large" } }
    },
    full: {
      $value: { value: 9999, unit: "px" },
      $description: "status\u3001ID\u3001\u4E38\u3044\u30DC\u30BF\u30F3",
      $extensions: { "com.yamayu-pkm": { source: "M3 corner-full" } }
    }
  },
  space: {
    "2": { $value: { value: 2, unit: "px" } },
    "4": { $value: { value: 4, unit: "px" } },
    "8": { $value: { value: 8, unit: "px" } },
    "12": { $value: { value: 12, unit: "px" } },
    "16": { $value: { value: 16, unit: "px" } },
    "20": { $value: { value: 20, unit: "px" } },
    "24": { $value: { value: 24, unit: "px" } },
    "32": { $value: { value: 32, unit: "px" } },
    "40": { $value: { value: 40, unit: "px" } },
    "48": { $value: { value: 48, unit: "px" } },
    "64": { $value: { value: 64, unit: "px" } },
    "96": { $value: { value: 96, unit: "px" } },
    $type: "dimension",
    $description: "\u4F59\u767D\uFF08padding / margin / gap / \u4F4D\u7F6E\uFF09\u306B\u4F7F\u3048\u308B\u5024\u30024px \u523B\u307F\u30022px \u306F\u7D30\u304B\u3044\u4F4D\u7F6E\u5408\u308F\u305B\u3060\u3051\u300164 / 96px \u306F\u5927\u304D\u3044\u9818\u57DF\uFF08Organize \u306E\u30B9\u30EF\u30A4\u30D7\u306E\u4F59\u767D\uFF09\u3060\u3051\u306B\u4F7F\u3046"
  },
  size: {
    $description: "\u5927\u304D\u3055\uFF08width / height \u306A\u3069\uFF09\u306F grid \u306E\u500D\u6570\u306B\u3059\u308B",
    grid: {
      $type: "dimension",
      $value: { value: 4, unit: "px" },
      $extensions: { "com.yamayu-pkm": { source: "M3 \u306E 4dp \u30B0\u30EA\u30C3\u30C9" } }
    },
    "target-min": {
      $type: "dimension",
      $value: { value: 24, unit: "px" },
      $description: "\u62BC\u305B\u308B\u3082\u306E\u306E\u6700\u5C0F\u306E\u5927\u304D\u3055",
      $extensions: { "com.yamayu-pkm": { source: "WCAG 2.5.8 Target Size (Minimum)" } }
    }
  },
  "border-width": {
    $type: "dimension",
    thin: {
      $value: { value: 1, unit: "px" },
      $description: "\u67A0\u7DDA"
    },
    thick: {
      $value: { value: 2, unit: "px" },
      $description: "\u5F37\u8ABF\u3057\u305F\u67A0\u7DDA\u3001\u30D5\u30A9\u30FC\u30AB\u30B9\u306E\u67A0"
    }
  },
  breakpoint: {
    $type: "dimension",
    $description: "@container \u3067\u4F7F\u3046\u30DA\u30A4\u30F3\u306E\u5E45\uFF08var() \u304C\u4F7F\u3048\u306A\u3044\u306E\u3067\u3001CSS \u306B\u306F\u540C\u3058\u6570\u5B57\u3092\u66F8\u304D\u3001\u691C\u67FB\u3067\u7167\u5408\u3059\u308B\uFF09",
    "pane-narrow": {
      $value: { value: 480, unit: "px" },
      $description: "\u3053\u308C\u4EE5\u4E0B\u3067\u6A2A\u4E26\u3073\u3092\u7E26\u4E26\u3073\u306B\u3059\u308B"
    },
    "pane-compact": {
      $value: { value: 300, unit: "px" },
      $description: "\u3053\u308C\u4EE5\u4E0B\u3067\u5DE5\u6570\u306E\u30BF\u30A4\u30EB\u3092 1 \u5217\u306B\u3059\u308B"
    },
    "pane-medium": {
      $value: { value: 720, unit: "px" },
      $description: "\u3053\u308C\u4EE5\u4E0B\u3067\u4E00\u89A7\u306E\u88DC\u52A9\u306E\u5217\u3092\u96A0\u3057\u3001\u30DC\u30FC\u30C9\u306E\u30B0\u30EB\u30FC\u30D7\u3092\u7E26\u306B\u7A4D\u3080"
    }
  },
  weight: {
    $type: "fontWeight",
    regular: { $value: 400 },
    medium: { $value: 500 },
    semibold: { $value: 600 },
    bold: { $value: 700 }
  },
  type: {
    $description: "\u6587\u5B57\u306E\u5F79\u5272\u3002\u5927\u304D\u3055\u306F Obsidian \u306E UI \u306E\u6587\u5B57\uFF0813px / 15px\uFF09\u3068 M3 \u306E type scale \u306B\u5408\u308F\u305B\u305F px",
    "headline-small": {
      $description: "summary",
      $extensions: { "com.yamayu-pkm": { source: "M3 headline-small\uFF0824/32\uFF09\u3002\u592A\u3055\u3060\u3051 600 \u306B\u3059\u308B" } },
      size: { $type: "dimension", $value: { value: 24, unit: "px" } },
      "line-height": { $type: "number", $value: 1.3333 },
      weight: { $type: "fontWeight", $value: "{weight.semibold}" },
      tracking: { $type: "dimension", $value: { value: -0.24, unit: "px" } }
    },
    "title-large": {
      $description: "\u5DE5\u6570\u306E\u6570\u5024",
      $extensions: { "com.yamayu-pkm": { source: "M3 title-large\uFF0822/28\uFF09\u3088\u308A 2px \u5C0F\u3055\u3044" } },
      size: { $type: "dimension", $value: { value: 20, unit: "px" } },
      "line-height": { $type: "number", $value: 1.4 },
      weight: { $type: "fontWeight", $value: "{weight.semibold}" },
      tracking: { $type: "dimension", $value: { value: 0, unit: "px" } }
    },
    "title-medium": {
      $description: "status\u3001\u72ED\u3044\u30DA\u30A4\u30F3\u306E\u5DE5\u6570",
      $extensions: { "com.yamayu-pkm": { source: "M3 title-medium\uFF0816/24\u30010.15px\uFF09" } },
      size: { $type: "dimension", $value: { value: 16, unit: "px" } },
      "line-height": { $type: "number", $value: 1.5 },
      weight: { $type: "fontWeight", $value: "{weight.semibold}" },
      tracking: { $type: "dimension", $value: { value: 0.15, unit: "px" } }
    },
    "body-medium": {
      $description: "\u672C\u6587",
      $extensions: { "com.yamayu-pkm": { source: "Obsidian --font-ui-medium\uFF0815px\uFF09" } },
      size: { $type: "dimension", $value: { value: 15, unit: "px" } },
      "line-height": { $type: "number", $value: 1.5 },
      weight: { $type: "fontWeight", $value: "{weight.regular}" },
      tracking: { $type: "dimension", $value: { value: 0, unit: "px" } }
    },
    "body-small": {
      $description: "\u88DC\u52A9\u306E\u672C\u6587",
      $extensions: { "com.yamayu-pkm": { source: "Obsidian --font-ui-small\uFF0813px\uFF09" } },
      size: { $type: "dimension", $value: { value: 13, unit: "px" } },
      "line-height": { $type: "number", $value: 1.5 },
      weight: { $type: "fontWeight", $value: "{weight.regular}" },
      tracking: { $type: "dimension", $value: { value: 0, unit: "px" } }
    },
    "label-medium": {
      $description: "\u30D0\u30C3\u30B8\u3001\u30C6\u30AD\u30B9\u30C8\u30DC\u30BF\u30F3\u3001\u6642\u9593",
      $extensions: { "com.yamayu-pkm": { source: "M3 label-medium\uFF0812/16\u30010.5px\uFF09" } },
      size: { $type: "dimension", $value: { value: 12, unit: "px" } },
      "line-height": { $type: "number", $value: 1.3333 },
      weight: { $type: "fontWeight", $value: "{weight.medium}" },
      tracking: { $type: "dimension", $value: { value: 0.5, unit: "px" } }
    },
    "label-small": {
      $description: "\u6B04\u306E\u540D\u524D\uFF08\u5927\u6587\u5B57\uFF09\u3001\u66DC\u65E5\u3001\u4EF6\u6570\u3001created / updated",
      $extensions: { "com.yamayu-pkm": { source: "M3 label-small\uFF0811/16\u30010.5px\uFF09" } },
      size: { $type: "dimension", $value: { value: 11, unit: "px" } },
      "line-height": { $type: "number", $value: 1.4545 },
      weight: { $type: "fontWeight", $value: "{weight.medium}" },
      tracking: { $type: "dimension", $value: { value: 0.5, unit: "px" } }
    }
  },
  duration: {
    $type: "duration",
    short2: {
      $value: { value: 100, unit: "ms" },
      $description: "\u62BC\u3057\u305F\u3068\u304D\u306E\u7E2E\u307F",
      $extensions: { "com.yamayu-pkm": { source: "M3 duration-short2" } }
    },
    short3: {
      $value: { value: 150, unit: "ms" },
      $description: "\u30DB\u30D0\u30FC\u306E\u8272\u30FB\u5F71\u30FB\u4E0D\u900F\u660E\u5EA6",
      $extensions: { "com.yamayu-pkm": { source: "M3 duration-short3" } }
    },
    short4: {
      $value: { value: 200, unit: "ms" },
      $description: "\u5927\u304D\u3044\u3082\u306E\u306E\u79FB\u52D5\uFF08Organize \u306E\u30AB\u30FC\u30C9\u304C\u623B\u308B\uFF09",
      $extensions: { "com.yamayu-pkm": { source: "M3 duration-short4" } }
    },
    pulse: {
      $value: { value: 1400, unit: "ms" },
      $description: "\u8A18\u9332\u4E2D\u306E\u70B9\u306E\u70B9\u6EC5\u306E\u5468\u671F\uFF08\u98FE\u308A\u3002\u52D5\u304D\u3092\u6E1B\u3089\u3059\u8A2D\u5B9A\u3067\u306F\u6B62\u3081\u308B\uFF09"
    },
    spin: {
      $value: { value: 4200, unit: "ms" },
      $description: "in-progress \u306E\u30A2\u30A4\u30B3\u30F3\u306E\u4E2D\u306E\u534A\u5186\u304C 1 \u5468\u3059\u308B\u6642\u9593\uFF08\u98FE\u308A\u3002\u76EE\u304C\u75B2\u308C\u306A\u3044\u3088\u3046\u306B\u3086\u3063\u304F\u308A\u3002\u52D5\u304D\u3092\u6E1B\u3089\u3059\u8A2D\u5B9A\u3067\u306F\u6B62\u3081\u308B\u3002ADR-0031\uFF09"
    }
  },
  easing: {
    $type: "cubicBezier",
    standard: {
      $value: [0.2, 0, 0, 1],
      $extensions: { "com.yamayu-pkm": { source: "M3 easing-standard" } }
    }
  },
  elevation: {
    "1": {
      $value: {
        color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.0588, hex: "#000000" },
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 2, unit: "px" },
        spread: { value: 0, unit: "px" }
      },
      $description: "\u62BC\u305B\u308B\u30AB\u30FC\u30C9"
    },
    "2": {
      $value: {
        color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1216, hex: "#000000" },
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 3, unit: "px" },
        spread: { value: 0, unit: "px" }
      },
      $description: "\u7DE8\u96C6\u3067\u304D\u308B\u30BF\u30A4\u30EB\u306E\u30DB\u30D0\u30FC"
    },
    "3": {
      $value: {
        color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1216, hex: "#000000" },
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 2, unit: "px" },
        blur: { value: 8, unit: "px" },
        spread: { value: 0, unit: "px" }
      },
      $description: "\u62BC\u305B\u308B\u30AB\u30FC\u30C9\u306E\u30DB\u30D0\u30FC"
    },
    "4": {
      $value: {
        color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1608, hex: "#000000" },
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 4, unit: "px" },
        blur: { value: 16, unit: "px" },
        spread: { value: 0, unit: "px" }
      },
      $description: "\u6D6E\u3044\u3066\u3044\u308B\u64CD\u4F5C\u30D0\u30FC"
    },
    "5": {
      $value: {
        color: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.1412, hex: "#000000" },
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 6, unit: "px" },
        blur: { value: 24, unit: "px" },
        spread: { value: 0, unit: "px" }
      },
      $description: "Organize \u306E\u30AB\u30FC\u30C9\uFF08\u6301\u3061\u4E0A\u3052\u3066\u52D5\u304B\u3059\u3082\u306E\uFF09"
    },
    $type: "shadow"
  },
  opacity: {
    $type: "number",
    disabled: {
      $value: 0.38,
      $description: "\u7121\u52B9\u306A\u3082\u306E",
      $extensions: { "com.yamayu-pkm": { source: "M3 disabled content opacity" } }
    },
    "state-hover": {
      $value: 0.08,
      $description: "currentColor \u3067 state layer \u3092\u4F5C\u308B\u3068\u304D\uFF08\u30DB\u30D0\u30FC\uFF09",
      $extensions: { "com.yamayu-pkm": { source: "M3 hover state layer" } }
    },
    "state-press": {
      $value: 0.12,
      $description: "currentColor \u3067 state layer \u3092\u4F5C\u308B\u3068\u304D\uFF08\u62BC\u4E0B\uFF09",
      $extensions: { "com.yamayu-pkm": { source: "M3 pressed state layer" } }
    }
  },
  scale: {
    $type: "number",
    "press-small": {
      $value: 0.92,
      $description: "40px \u4EE5\u4E0B\u306E\u4E38\u3044\u30DC\u30BF\u30F3\u30FB\u65E5\u4ED8\u3092\u62BC\u3057\u305F\u3068\u304D"
    },
    "press-medium": {
      $value: 0.97,
      $description: "\u30DC\u30BF\u30F3\u3092\u62BC\u3057\u305F\u3068\u304D"
    },
    "press-large": {
      $value: 0.99,
      $description: "\u30AB\u30FC\u30C9\u3092\u62BC\u3057\u305F\u3068\u304D"
    }
  }
};

// node/theme-cli.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// src/color.ts
var HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function isHex(text) {
  return HEX.test(text);
}
function parseHex(text) {
  if (!isHex(text)) throw new Error(`\u8272\u306E\u66F8\u5F0F\u304C\u9055\u3044\u307E\u3059: ${text}`);
  let h = text.slice(1);
  if (h.length <= 4) h = [...h].map((c) => c + c).join("");
  const n = (i) => Number.parseInt(h.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
}
function toHex(c) {
  const p = (v) => Math.round(v).toString(16).padStart(2, "0");
  const alpha = c.a >= 1 ? "" : p(c.a * 255);
  return `#${p(c.r)}${p(c.g)}${p(c.b)}${alpha}`;
}
function over(top, bottom) {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1
  };
}
function stack(layers) {
  const [first, ...rest] = layers;
  if (!first) throw new Error("\u91CD\u306D\u308B\u8272\u304C\u3042\u308A\u307E\u305B\u3093");
  if (first.a < 1) throw new Error("\u4E00\u756A\u4E0B\u306E\u8272\u306F\u4E0D\u900F\u660E\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  return rest.reduce((acc, c) => over(c, acc), first);
}
function channel(v) {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function relativeLuminance(c) {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}
function contrastRatio(foreground, background) {
  if (background.a < 1) throw new Error("\u80CC\u666F\u306F\u4E0D\u900F\u660E\u306B\u3057\u3066\u304F\u3060\u3055\u3044");
  const fg = foreground.a < 1 ? over(foreground, background) : foreground;
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function formatRatio(ratio) {
  return (Math.floor(ratio * 100) / 100).toFixed(2);
}

// src/tokens.ts
var EXT = "com.yamayu-pkm";
var PREFIX = "--vt-";
var MODES = ["light", "dark"];
var TYPES = ["color", "dimension", "number", "fontWeight", "duration", "cubicBezier", "shadow"];
var ROLES = ["surface", "text", "graphic", "state", "decorative"];
var FOLLOW_RULES = ["container", "on-container", "on-color"];
var FONT_WEIGHTS = { thin: 100, light: 300, normal: 400, regular: 400, medium: 500, bold: 700 };
var TokenError = class extends Error {
};
function isObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
var ALIAS = /^\{([^{}]+)\}$/;
function aliasTarget(value) {
  return typeof value === "string" ? ALIAS.exec(value)?.[1] ?? null : null;
}
function cssVarOf(path) {
  const parts = path.split(".");
  if (parts[0] === "color") parts.shift();
  return PREFIX + parts.join("-");
}
function loadTokens(json) {
  const errors = [];
  const tokens = [];
  if (!isObject(json)) throw new TokenError("tokens.json \u306E\u4E2D\u8EAB\u304C\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
  const walk = (node, path, inherited) => {
    const groupType = node.$type ?? inherited.type;
    const ext = isObject(node.$extensions) ? node.$extensions[EXT] : void 0;
    const group = {
      type: groupType,
      description: path.length > 0 && typeof node.$description === "string" ? node.$description : inherited.description,
      source: isObject(ext) && typeof ext.source === "string" ? ext.source : inherited.source
    };
    if (node.$type !== void 0 && !TYPES.includes(node.$type)) {
      errors.push(`${path.join(".")}: \u77E5\u3089\u306A\u3044 $type\u300C${String(node.$type)}\u300D`);
    }
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      if (/[{}.]/.test(key)) errors.push(`${[...path, key].join(".")}: \u540D\u524D\u306B { } . \u306F\u4F7F\u3048\u307E\u305B\u3093`);
      if (!isObject(child)) {
        errors.push(`${[...path, key].join(".")}: \u30B0\u30EB\u30FC\u30D7\u304B\u30C8\u30FC\u30AF\u30F3\u306E\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
        continue;
      }
      const childPath = [...path, key];
      if ("$value" in child) tokens.push(readToken(child, childPath, child.$type ?? groupType, group, errors));
      else walk(child, childPath, group);
    }
  };
  walk(json, [], {});
  const byPath = new Map(tokens.map((t) => [t.path, t]));
  const names = /* @__PURE__ */ new Map();
  for (const t of tokens) {
    const prev = names.get(t.cssVar);
    if (prev) errors.push(`${t.path}: CSS \u5909\u6570\u540D ${t.cssVar} \u304C ${prev} \u3068\u91CD\u306A\u308A\u307E\u3059`);
    names.set(t.cssVar, t.path);
    for (const mode of MODES) {
      const target = aliasTarget(t.raw[mode]);
      if (target !== null) {
        const ref = byPath.get(target);
        if (!ref) errors.push(`${t.path}: \u5225\u540D\u306E\u53C2\u7167\u5148 ${target} \u304C\u3042\u308A\u307E\u305B\u3093`);
        else if (ref.type !== t.type) errors.push(`${t.path}: \u5225\u540D\u306E\u53C2\u7167\u5148 ${target} \u306E\u578B\u304C\u9055\u3044\u307E\u3059\uFF08${ref.type}\uFF09`);
      }
    }
    for (const layers of t.contrast?.on ?? []) {
      for (const p of layers) {
        const ref = byPath.get(p);
        if (!ref) errors.push(`${t.path}: contrast.on \u306E ${p} \u304C\u3042\u308A\u307E\u305B\u3093`);
        else if (ref.type !== "color") errors.push(`${t.path}: contrast.on \u306E ${p} \u306F\u8272\u3067\u306F\u3042\u308A\u307E\u305B\u3093`);
      }
    }
  }
  for (const t of tokens) {
    for (const mode of MODES) {
      try {
        resolveRaw(byPath, t.path, mode);
      } catch (e) {
        errors.push(e.message);
      }
    }
  }
  for (const t of tokens) {
    if (t.derive === void 0) continue;
    const ref = byPath.get(t.derive);
    if (!ref || ref.type !== "color") {
      errors.push(`${t.path}: derive \u306E\u53C2\u7167\u5148 ${t.derive} \u304C\u3042\u308A\u307E\u305B\u3093\uFF08\u307E\u305F\u306F\u8272\u3067\u306F\u3042\u308A\u307E\u305B\u3093\uFF09`);
      continue;
    }
    if (ref.derive !== void 0) errors.push(`${t.path}: derive \u306E\u53C2\u7167\u5148 ${t.derive} \u3082 derive \u3067\u3059\uFF08\u5143\u306E\u8272\u3092\u6307\u3057\u3066\u304F\u3060\u3055\u3044\uFF09`);
  }
  for (const t of tokens) {
    if (t.follow === void 0) continue;
    if (!t.vault) errors.push(`${t.path}: follow \u306F vault \u306E\u8272\u3060\u3051\u306B\u4ED8\u3051\u3089\u308C\u307E\u3059`);
    const ref = byPath.get(t.follow.from);
    if (!ref || ref.type !== "color" || !ref.vault) errors.push(`${t.path}: follow \u306E\u5143 ${t.follow.from} \u306F vault \u306E\u8272\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
  }
  if (errors.length > 0) throw new TokenError(errors.join("\n"));
  for (const t of tokens) {
    if (t.derive === void 0) continue;
    for (const mode of MODES) {
      const own = resolveColor(tokens, t.path, mode);
      const from = resolveColor(tokens, t.derive, mode);
      if (own.r !== from.r || own.g !== from.g || own.b !== from.b) {
        errors.push(`${t.path}: derive \u306E\u5143 ${t.derive}\uFF08${mode}\uFF09\u3068\u8272\u76F8\u304C\u5408\u3044\u307E\u305B\u3093\uFF08${toHex({ ...from, a: 1 })} \u306B\u3059\u308B\uFF09`);
      }
    }
  }
  for (const t of tokens) {
    for (const layers of t.contrast?.on ?? []) {
      for (const mode of MODES) {
        if (resolveColor(tokens, layers[0], mode).a < 1) errors.push(`${t.path}: contrast.on \u306E\u4E00\u756A\u4E0B\uFF08${layers[0]}\u3001${mode}\uFF09\u306F\u4E0D\u900F\u660E\u306A\u8272\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      }
    }
  }
  if (errors.length > 0) throw new TokenError(errors.join("\n"));
  return tokens;
}
function readToken(node, path, type, group, errors) {
  const p = path.join(".");
  if (!type || !TYPES.includes(type)) errors.push(`${p}: $type \u304C\u3042\u308A\u307E\u305B\u3093\uFF08\u307E\u305F\u306F\u77E5\u3089\u306A\u3044\u578B\u3067\u3059\uFF09`);
  const t = type ?? "number";
  const ext = isObject(node.$extensions) ? node.$extensions[EXT] : void 0;
  const e = isObject(ext) ? ext : {};
  if (ext !== void 0 && !isObject(ext)) errors.push(`${p}: $extensions.${EXT} \u306F\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
  for (const key of Object.keys(e)) {
    if (!["dark", "role", "contrast", "obsidian", "plugin", "source", "vault", "derive", "follow"].includes(key)) errors.push(`${p}: \u77E5\u3089\u306A\u3044\u62E1\u5F35\u300C${key}\u300D`);
  }
  const light = node.$value;
  const dark = "dark" in e ? e.dark : light;
  validateValue(t, light, `${p}`, errors);
  if ("dark" in e) validateValue(t, dark, `${p}\uFF08dark\uFF09`, errors);
  const token = {
    path: p,
    cssVar: cssVarOf(p),
    type: t,
    // 説明と根拠がなければ、グループのものを使う（type.label-small.size など）
    description: typeof node.$description === "string" ? node.$description : group.description ?? "",
    raw: { light, dark },
    obsidian: [],
    plugin: e.plugin !== false,
    vault: e.vault === true
  };
  if ("vault" in e) {
    if (typeof e.vault !== "boolean") errors.push(`${p}: vault \u306F true / false \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    else if (e.vault && (t !== "color" || aliasTarget(light) !== null || aliasTarget(dark) !== null || "derive" in e)) {
      errors.push(`${p}: vault \u306F\u3001\u5225\u540D\u3067\u3082 derive \u3067\u3082\u306A\u3044\u8272\u3060\u3051\u306B\u4ED8\u3051\u3089\u308C\u307E\u3059`);
    }
  }
  if ("derive" in e) {
    const target = aliasTarget(e.derive);
    if (t !== "color" || target === null) errors.push(`${p}: derive \u306F\u8272\u306B\u3001{path} \u306E\u5225\u540D\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044`);
    else token.derive = target;
  }
  if ("follow" in e) {
    const f = e.follow;
    const from = isObject(f) ? aliasTarget(f.from) : null;
    if (t !== "color" || !isObject(f) || from === null) errors.push(`${p}: follow \u306F\u8272\u306B\u3001{ "from": "{path}", "rule": "..." } \u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044`);
    else if (!FOLLOW_RULES.includes(f.rule)) errors.push(`${p}: follow \u306E rule\u300C${String(f.rule)}\u300D\u3092\u77E5\u308A\u307E\u305B\u3093\uFF08${FOLLOW_RULES.join(" / ")}\uFF09`);
    else token.follow = { from, rule: f.rule };
  }
  if (typeof e.source === "string") token.source = e.source;
  else if (group.source !== void 0) token.source = group.source;
  if ("role" in e) {
    if (t !== "color") errors.push(`${p}: role \u306F\u8272\u3060\u3051\u306B\u4ED8\u3051\u3089\u308C\u307E\u3059`);
    if (!ROLES.includes(e.role)) errors.push(`${p}: \u77E5\u3089\u306A\u3044 role\u300C${String(e.role)}\u300D`);
    token.role = e.role;
  } else if (t === "color" && path[0] === "color") {
    errors.push(`${p}: \u8272\u306B\u306F role \u3092\u4ED8\u3051\u3066\u304F\u3060\u3055\u3044\uFF08${ROLES.join(" / ")}\uFF09`);
  }
  if ("contrast" in e) {
    const c = e.contrast;
    if (!isObject(c) || typeof c.min !== "number" || !Array.isArray(c.on)) {
      errors.push(`${p}: contrast \u306F { min: \u6570, on: [...] } \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    } else {
      const on = [];
      for (const item of c.on) {
        const layers = (Array.isArray(item) ? item : [item]).map(aliasTarget);
        if (layers.length === 0 || layers.some((l) => l === null)) errors.push(`${p}: contrast.on \u306F {path} \u306E\u5225\u540D\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044`);
        else on.push(layers);
      }
      token.contrast = { min: c.min, on };
    }
  }
  if (token.role === "text" || token.role === "graphic") {
    const floor = token.role === "text" ? 4.5 : 3;
    if (!token.contrast) errors.push(`${p}: ${token.role} \u306E\u8272\u306B\u306F contrast \u3092\u66F8\u3044\u3066\u304F\u3060\u3055\u3044`);
    else if (token.contrast.min < floor) errors.push(`${p}: ${token.role} \u306E contrast.min \u306F ${floor} \u4EE5\u4E0A\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
  }
  if ("obsidian" in e) {
    if (!Array.isArray(e.obsidian) || e.obsidian.some((v) => typeof v !== "string" || !v.startsWith("--"))) {
      errors.push(`${p}: obsidian \u306F CSS \u5909\u6570\u540D\u306E\u914D\u5217\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
    } else token.obsidian = e.obsidian;
  }
  return token;
}
function isDimension(v, units) {
  return isObject(v) && typeof v.value === "number" && Number.isFinite(v.value) && units.includes(v.unit);
}
function validateValue(type, value, where, errors) {
  if (aliasTarget(value) !== null) return;
  switch (type) {
    case "color": {
      const err = colorError(value);
      if (err) errors.push(`${where}: ${err}`);
      return;
    }
    case "dimension":
      if (!isDimension(value, ["px", "rem"])) errors.push(`${where}: dimension \u306F { value, unit: "px" | "rem" } \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      return;
    case "duration":
      if (!isDimension(value, ["ms", "s"])) errors.push(`${where}: duration \u306F { value, unit: "ms" | "s" } \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      return;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) errors.push(`${where}: number \u306F\u6570\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      return;
    case "fontWeight":
      if (!(typeof value === "number" && value >= 1 && value <= 1e3) && !(typeof value === "string" && value in FONT_WEIGHTS)) {
        errors.push(`${where}: fontWeight \u306F 1\u301C1000 \u306E\u6570\u304B\u3001\u6C7A\u307E\u3063\u305F\u540D\u524D\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      }
      return;
    case "cubicBezier":
      if (!Array.isArray(value) || value.length !== 4 || value.some((v) => typeof v !== "number")) {
        errors.push(`${where}: cubicBezier \u306F\u6570 4 \u3064\u306E\u914D\u5217\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      } else if ([value[0], value[2]].some((x) => x < 0 || x > 1)) {
        errors.push(`${where}: cubicBezier \u306E x \u306F 0\u301C1 \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      }
      return;
    case "shadow": {
      const list = Array.isArray(value) ? value : [value];
      for (const s of list) {
        if (!isObject(s)) {
          errors.push(`${where}: shadow \u306F\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
          continue;
        }
        for (const k of ["offsetX", "offsetY", "blur", "spread"]) {
          if (!isDimension(s[k], ["px", "rem"])) errors.push(`${where}: shadow \u306E ${k} \u306F dimension \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
        }
        const err = aliasTarget(s.color) === null ? colorError(s.color) : null;
        if (err) errors.push(`${where}: shadow \u306E color: ${err}`);
      }
      return;
    }
  }
}
function colorError(value) {
  if (!isObject(value)) return "\u8272\u306F { colorSpace, components, alpha?, hex? } \u306B\u3057\u3066\u304F\u3060\u3055\u3044";
  if (value.colorSpace !== "srgb") return "colorSpace \u306F srgb \u3060\u3051\u3092\u4F7F\u3044\u307E\u3059";
  const comp = value.components;
  if (!Array.isArray(comp) || comp.length !== 3 || comp.some((c) => typeof c !== "number" || c < 0 || c > 1)) {
    return "components \u306F 0\u301C1 \u306E\u6570 3 \u3064\u306B\u3057\u3066\u304F\u3060\u3055\u3044";
  }
  if (value.alpha !== void 0 && (typeof value.alpha !== "number" || value.alpha < 0 || value.alpha > 1)) {
    return "alpha \u306F 0\u301C1 \u306B\u3057\u3066\u304F\u3060\u3055\u3044";
  }
  if (typeof value.hex !== "string" || !isHex(value.hex) || value.hex.length !== 7) return "hex\uFF08#rrggbb\uFF09\u3092\u66F8\u3044\u3066\u304F\u3060\u3055\u3044";
  const h = parseHex(value.hex);
  const expected = [h.r, h.g, h.b].map((v) => v / 255);
  if (expected.some((v, i) => Math.abs(v - comp[i]) > 0.5 / 255)) {
    return `components \u304C hex ${value.hex} \u3068\u5408\u3044\u307E\u305B\u3093\uFF08${expected.map((v) => +v.toFixed(4)).join(", ")}\uFF09`;
  }
  return null;
}
function resolveRaw(byPath, path, mode, seen = []) {
  if (seen.includes(path)) throw new TokenError(`\u5225\u540D\u304C\u5FAA\u74B0\u3057\u3066\u3044\u307E\u3059: ${[...seen, path].join(" \u2192 ")}`);
  const token = byPath.get(path);
  if (!token) throw new TokenError(`\u30C8\u30FC\u30AF\u30F3 ${path} \u304C\u3042\u308A\u307E\u305B\u3093`);
  const target = aliasTarget(token.raw[mode]);
  if (target === null) return { token, value: token.raw[mode] };
  return resolveRaw(byPath, target, mode, [...seen, path]);
}
function resolveValue(tokens, path, mode) {
  return resolveRaw(new Map(tokens.map((t) => [t.path, t])), path, mode).value;
}
function colorValue(value) {
  const v = value;
  const c = parseHex(v.hex);
  return { ...c, a: v.alpha ?? 1 };
}
function resolveColor(tokens, path, mode) {
  return colorValue(resolveValue(tokens, path, mode));
}

// src/diagram.ts
var DIAGRAM_COLORS = ["blue", "green", "purple", "gray", "sky", "pink", "red", "amber"];
var NEUTRAL = {
  /** 文字 */
  text: "color.on-surface",
  /** 補助の文字（辺のラベル） */
  muted: "color.on-surface-variant",
  /** ノードの面 */
  nodeFill: "color.surface",
  /** ノードの枠 */
  nodeStroke: "color.outline",
  /** グループの面 */
  groupFill: "color.surface-container",
  /** グループの枠 */
  groupStroke: "color.outline",
  /** 辺と矢印 */
  edge: "color.on-surface-variant",
  /** ラベルの背景（辺のラベルを線から浮かせる） */
  labelBg: "color.surface"
};
function diagramPalette(tokens, mode) {
  const hex = (path) => toHex(resolveColor(tokens, path, mode));
  const neutral = Object.fromEntries(Object.entries(NEUTRAL).map(([role, path]) => [role, hex(path)]));
  const colors = Object.fromEntries(
    DIAGRAM_COLORS.map((name) => [name, { fill: hex(`color.${name}-container`), stroke: hex(`color.${name}`), text: hex(`color.on-${name}-container`) }])
  );
  return { neutral, colors };
}
function mermaidCss(tokens, { root: root2 = "body", modes = MODES } = {}) {
  const lines = ["", "/* Mermaid \u306E\u56F3\u306E\u8272\u3092\u3001\u56F3\u306E\u914D\u8272\uFF08ADR-0102\uFF09\u306B\u63C3\u3048\u308B\u3002\u8272\u306F A:::blue \u304B class A blue \u3067\u4ED8\u3051\u308B */"];
  const rule = (selectors, decls) => {
    lines.push(`${selectors.join(",\n")} {`);
    for (const [k, v] of Object.entries(decls)) lines.push(`	${k}: ${v} !important;`);
    lines.push("}");
  };
  for (const mode of modes) {
    const p = diagramPalette(tokens, mode);
    const at = (s) => `${root2}.theme-${mode} .mermaid ${s}`;
    const shapes = (scope) => ["rect", "circle", "ellipse", "polygon", "path.basic", ".label-container"].map((s) => at(`${scope} ${s}`));
    lines.push("");
    rule(shapes(".node"), { fill: p.neutral.nodeFill, stroke: p.neutral.nodeStroke });
    rule([at(".node .nodeLabel"), at(".node .label"), at(".node text")], { color: p.neutral.text, fill: p.neutral.text });
    rule([at(".cluster rect"), at(".cluster polygon")], { fill: p.neutral.groupFill, stroke: p.neutral.groupStroke });
    rule([at(".cluster .nodeLabel"), at(".cluster-label"), at(".cluster text")], { color: p.neutral.text, fill: p.neutral.text });
    rule([at(".flowchart-link"), at(".edgePath .path"), at(".messageLine0"), at(".messageLine1"), at(".transition")], { stroke: p.neutral.edge });
    rule([at("marker path"), at(".arrowheadPath"), at(".arrowMarkerPath"), at("#arrowhead path")], { fill: p.neutral.edge, stroke: p.neutral.edge });
    rule([at(".edgeLabel"), at(".edgeLabel p"), at(".edgeLabel span"), at(".labelBkg")], { color: p.neutral.muted, "background-color": p.neutral.labelBg });
    rule([at(".edgeLabel rect")], { fill: p.neutral.labelBg });
    rule([at(".actor"), at(".statediagram-state rect"), at(".stateGroup rect")], { fill: p.neutral.nodeFill, stroke: p.neutral.nodeStroke });
    rule([at(".messageText"), at("text.actor > tspan"), at(".noteText")], { fill: p.neutral.text });
    rule([at(".note")], { fill: p.colors.amber.fill, stroke: p.colors.amber.stroke });
    for (const name of DIAGRAM_COLORS) {
      const c = p.colors[name];
      rule([...shapes(`.node.${name}`), at(`.cluster.${name} rect`), at(`.cluster.${name} polygon`)], { fill: c.fill, stroke: c.stroke });
      rule([at(`.node.${name} .nodeLabel`), at(`.node.${name} text`), at(`.cluster.${name} .nodeLabel`), at(`.cluster.${name} text`)], { color: c.text, fill: c.text });
    }
  }
  lines.push("");
  return lines.join("\n");
}

// src/primary.ts
var CONTAINER_MIX = 0.16;
var WHITE = { r: 255, g: 255, b: 255, a: 1 };
function mix(a, b, t) {
  const ch = (x, y) => x + (y - x) * t;
  return { r: ch(a.r, b.r), g: ch(a.g, b.g), b: ch(a.b, b.b), a: 1 };
}
function containerOf(surface, primary) {
  return mix(surface, primary, CONTAINER_MIX);
}
function onColorOf(primary, darkText) {
  return contrastRatio(WHITE, primary) >= contrastRatio(darkText, primary) ? WHITE : darkText;
}
function lightenUntil(base, ok) {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const c = mix(base, WHITE, t);
    if (ok(c)) return c;
  }
  return { ...WHITE };
}

// src/contrast.ts
function checkContrast(tokens) {
  const results = [];
  for (const t of tokens) {
    if (!t.contrast) continue;
    for (const mode of MODES) {
      for (const layers of t.contrast.on) {
        const bg = stack(layers.map((p) => resolveColor(tokens, p, mode)));
        const ratio = contrastRatio(resolveColor(tokens, t.path, mode), bg);
        results.push({ token: t.path, mode, on: layers, ratio, min: t.contrast.min, ok: ratio >= t.contrast.min });
      }
    }
  }
  return results;
}

// src/theme.ts
var THEME_FILE = ".kit-local/theme.json";
var LOCAL_SNIPPET_NAME = "pkm-theme-local";
var LOCAL_SNIPPET_FILE = `.obsidian/snippets/${LOCAL_SNIPPET_NAME}.css`;
var MODE_TEXT = { light: "\u30E9\u30A4\u30C8", dark: "\u30C0\u30FC\u30AF" };
var nameOf = (path) => path.replace(/^color\./, "");
function isObject2(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function vaultColorNames(tokens) {
  return tokens.filter((t) => t.vault).map((t) => nameOf(t.path));
}
function parseTheme(json, tokens) {
  const theme = { light: {}, dark: {} };
  const errors = [];
  if (!isObject2(json)) return { theme, errors: [`${THEME_FILE}: \u4E2D\u8EAB\u3092 { "light": { ... }, "dark": { ... } } \u306E\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306B\u3057\u3066\u304F\u3060\u3055\u3044`] };
  const allowed = new Set(vaultColorNames(tokens));
  for (const [key, value] of Object.entries(json)) {
    if (key === "$comment") continue;
    if (!MODES.includes(key)) {
      errors.push(`${THEME_FILE}: \u77E5\u3089\u306A\u3044\u30AD\u30FC\u300C${key}\u300D\uFF08light / dark \u3060\u3051\uFF09`);
      continue;
    }
    if (!isObject2(value)) {
      errors.push(`${THEME_FILE}: ${key} \u306F { "\u8272\u306E\u540D\u524D": "#rrggbb" } \u306B\u3057\u3066\u304F\u3060\u3055\u3044`);
      continue;
    }
    for (const [name, hex] of Object.entries(value)) {
      if (!allowed.has(name)) {
        errors.push(`${THEME_FILE}: ${key}.${name} \u306F\u4E0A\u66F8\u304D\u3067\u304D\u307E\u305B\u3093\uFF08\u4E0A\u66F8\u304D\u3067\u304D\u308B\u306E\u306F ${[...allowed].join(", ")}\uFF09`);
        continue;
      }
      if (typeof hex !== "string" || !/^#[0-9a-f]{6}$/i.test(hex)) {
        errors.push(`${THEME_FILE}: ${key}.${name} \u306F\u4E0D\u900F\u660E\u306A #rrggbb \u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\uFF08${JSON.stringify(hex)}\uFF09`);
        continue;
      }
      theme[key][name] = hex.toLowerCase();
    }
  }
  return { theme, errors };
}
function colorJson(hex, alpha) {
  const c = parseHex(hex);
  const components = [c.r, c.g, c.b].map((v) => +(v / 255).toFixed(4));
  return { colorSpace: "srgb", components, ...alpha === void 0 || alpha >= 1 ? {} : { alpha }, hex };
}
function withOverrides(tokens, theme) {
  return tokens.map((t) => {
    if (!t.vault) return t;
    const raw = { ...t.raw };
    for (const mode of MODES) {
      const hex = theme[mode][nameOf(t.path)];
      if (hex !== void 0) raw[mode] = colorJson(hex);
    }
    return { ...t, raw };
  });
}
function withDerived(out) {
  return out.map((t) => {
    if (t.derive === void 0) return t;
    const raw = { ...t.raw };
    for (const mode of MODES) {
      const from = resolveColor(out, t.derive, mode);
      const own = resolveColor(out, t.path, mode);
      raw[mode] = colorJson(toHex({ ...from, a: 1 }), t.raw[mode].alpha ?? own.a);
    }
    return { ...t, raw };
  });
}
function followValue(tokens, t, mode) {
  const from = resolveColor(tokens, t.follow.from, mode);
  switch (t.follow.rule) {
    case "container":
      return toHex(containerOf(resolveColor(tokens, "color.surface", mode), from));
    case "on-container":
      return toHex(resolveColor(tokens, "color.on-surface", mode));
    case "on-color":
      return toHex(onColorOf(from, resolveColor(tokens, "color.on-surface", "light")));
  }
}
var cloneTheme = (theme) => ({ light: { ...theme.light }, dark: { ...theme.dark } });
function fillFollow(tokens, theme, mode) {
  const base = withOverrides(tokens, theme);
  for (const t of tokens) {
    if (t.follow === void 0) continue;
    const name = nameOf(t.path);
    if (theme[mode][nameOf(t.follow.from)] === void 0 || theme[mode][name] !== void 0) continue;
    theme[mode][name] = followValue(base, t, mode);
  }
}
var PRIMARY = "primary";
function completeTheme(tokens, theme) {
  const out = cloneTheme(theme);
  const light = out.light[PRIMARY];
  if (light !== void 0 && out.dark[PRIMARY] === void 0) {
    const dark = lightenUntil(parseHex(light), (c) => {
      const trial = cloneTheme(out);
      trial.dark[PRIMARY] = toHex(c);
      fillFollow(tokens, trial, "dark");
      const themed = withDerived(withOverrides(tokens, trial));
      return checkContrast(themed).every((r) => r.ok || r.mode !== "dark" || r.token !== `color.${PRIMARY}` && r.token !== "color.on-primary");
    });
    out.dark[PRIMARY] = toHex(dark);
  }
  for (const mode of MODES) fillFollow(tokens, out, mode);
  return out;
}
function madeColors(tokens, theme) {
  const full = completeTheme(tokens, theme);
  const names = tokens.filter((t) => t.vault).map((t) => nameOf(t.path));
  const made = (mode) => names.filter((n) => theme[mode][n] === void 0 && full[mode][n] !== void 0);
  return { light: made("light"), dark: made("dark") };
}
function applyTheme(tokens, theme) {
  return withDerived(withOverrides(tokens, completeTheme(tokens, theme)));
}
var SURFACE_STEPS = ["color.surface", "color.surface-container", "color.surface-container-high"];
function checkTheme(tokens) {
  const problems = [];
  for (const r of checkContrast(tokens)) {
    if (r.ok) continue;
    problems.push(`\u30B3\u30F3\u30C8\u30E9\u30B9\u30C8\u4E0D\u8DB3: ${nameOf(r.token)}\uFF08${MODE_TEXT[r.mode]}\uFF09on ${r.on.map(nameOf).join(" + ")} = ${formatRatio(r.ratio)} < ${r.min}`);
  }
  for (const mode of MODES) {
    const lum = SURFACE_STEPS.map((p) => relativeLuminance(resolveColor(tokens, p, mode)));
    for (let i = 1; i < lum.length; i++) {
      const prev = lum[i - 1];
      const cur = lum[i];
      const ok = mode === "light" ? cur <= prev : cur >= prev;
      if (!ok) {
        problems.push(
          `\u9762\u306E\u6BB5\u5DEE\uFF08${MODE_TEXT[mode]}\uFF09: ${nameOf(SURFACE_STEPS[i])} \u306F ${nameOf(SURFACE_STEPS[i - 1])} \u3088\u308A${mode === "light" ? "\u6697\u304F" : "\u660E\u308B\u304F"}\u3057\u3066\u304F\u3060\u3055\u3044`
        );
      }
    }
  }
  return problems;
}
function themeAccent(tokens) {
  return toHex(resolveColor(tokens, "color.primary", "light"));
}
function themeSnippet(base, themed) {
  const lines = [
    `/* \u751F\u6210\u7269\u3002\u624B\u3067\u7DE8\u96C6\u3057\u306A\u3044\u3002\u6B63\u672C\u306F ${THEME_FILE}\uFF08node .kit/bin/theme.mjs build \u3067\u4F5C\u308A\u76F4\u3059\uFF09 */`,
    "/* \u5B50\u306E Vault \u306E\u57FA\u672C\u306E\u8272\uFF08.kit/src/docs/adr/0121-vault-theme.md\uFF09\u3002\u4E0A\u6D41\u306E\u5024\u304B\u3089\u5909\u308F\u3063\u305F\u8272\u3060\u3051\u3092\u66F8\u304F */"
  ];
  for (const mode of MODES) {
    const body = [];
    for (const t of themed) {
      if (t.type !== "color") continue;
      const now = toHex(resolveColor(themed, t.path, mode));
      if (now === toHex(resolveColor(base, t.path, mode))) continue;
      if (t.plugin && aliasTarget(t.raw[mode]) === null) body.push(`	${t.cssVar}: ${now};`);
      for (const name of t.obsidian) body.push(`	${name}: ${now};`);
    }
    if (body.length > 0) lines.push("", `html body.theme-${mode} {`, ...body, "}");
  }
  const mermaidModes = MODES.filter((mode) => JSON.stringify(diagramPalette(base, mode)) !== JSON.stringify(diagramPalette(themed, mode)));
  if (mermaidModes.length > 0) lines.push(mermaidCss(themed, { root: "html body", modes: mermaidModes }).replace(/\n$/, ""));
  lines.push("");
  return lines.join("\n");
}

// node/theme-cli.ts
var APPEARANCE = ".obsidian/appearance.json";
function readJson(path) {
  try {
    return { value: JSON.parse(readFileSync(path, "utf8")) };
  } catch (e) {
    return { error: `${path} \u304C JSON \u3068\u3057\u3066\u8AAD\u3081\u307E\u305B\u3093\uFF08${e.message}\uFF09` };
  }
}
function appearanceProblems(root2, accent) {
  const path = join(root2, APPEARANCE);
  const a = existsSync(path) ? readJson(path).value : void 0;
  const obj = typeof a === "object" && a !== null ? a : {};
  const problems = [];
  if (typeof obj.accentColor !== "string" || obj.accentColor.toLowerCase() !== accent) {
    problems.push(`${APPEARANCE}: accentColor \u304C ${JSON.stringify(obj.accentColor)}\uFF08${accent} \u306B\u3059\u308B\u3002node .kit/bin/theme.mjs build \u3067\u5408\u308F\u305B\u308B\uFF09`);
  }
  if (!Array.isArray(obj.enabledCssSnippets) || !obj.enabledCssSnippets.includes(LOCAL_SNIPPET_NAME)) {
    problems.push(`${APPEARANCE}: enabledCssSnippets \u306B "${LOCAL_SNIPPET_NAME}" \u304C\u306A\u3044\uFF08node .kit/bin/theme.mjs build \u3067\u5408\u308F\u305B\u308B\uFF09`);
  }
  return problems;
}
function writeAppearance(root2, accent) {
  const path = join(root2, APPEARANCE);
  const a = existsSync(path) ? readJson(path).value : void 0;
  const obj = { ...typeof a === "object" && a !== null && !Array.isArray(a) ? a : {} };
  obj.accentColor = accent;
  const snippets = Array.isArray(obj.enabledCssSnippets) ? [...obj.enabledCssSnippets] : [];
  if (!snippets.includes(LOCAL_SNIPPET_NAME)) snippets.push(LOCAL_SNIPPET_NAME);
  obj.enabledCssSnippets = snippets;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2));
}
function load(root2, tokens) {
  const path = join(root2, THEME_FILE);
  const json = readJson(path);
  if (json.error) return { problems: [json.error] };
  const { theme, errors } = parseTheme(json.value, tokens);
  if (errors.length > 0) return { problems: errors };
  const themed = applyTheme(tokens, theme);
  const problems = checkTheme(themed);
  if (problems.length === 0) return { themed, problems: [] };
  const made = madeColors(tokens, theme);
  const list = MODES.flatMap((mode) => made[mode].map((name) => `${mode}.${name}`));
  if (list.length > 0) problems.push(`primary \u304B\u3089\u4F5C\u3063\u305F\u8272: ${list.join(", ")}\uFF08\u5408\u308F\u306A\u3044\u8272\u306F\u3001\u5024\u3092 ${THEME_FILE} \u306B\u66F8\u304F\u3068\u3001\u4F5C\u3089\u305A\u306B\u305D\u306E\u5024\u3092\u4F7F\u3046\uFF09`);
  return { problems };
}
function runTheme(args, root2, tokens) {
  const out = [];
  const err = [];
  const [command] = args;
  const hasTheme = existsSync(join(root2, THEME_FILE));
  const hasSnippet = existsSync(join(root2, LOCAL_SNIPPET_FILE));
  if (command === "list") {
    out.push(`${THEME_FILE} \u3067\u4E0A\u66F8\u304D\u3067\u304D\u308B\u8272\uFF08\u4E0A\u6D41\u306E\u5024: \u30E9\u30A4\u30C8 / \u30C0\u30FC\u30AF\uFF09`);
    for (const name of vaultColorNames(tokens)) {
      const t = tokens.find((x) => x.path === `color.${name}`);
      const v = (mode) => toHex(resolveColor(tokens, t.path, mode));
      const follow = t.follow ? `\uFF08${t.follow.from.replace(/^color\./, "")} \u3092\u5909\u3048\u3066\u3001\u3053\u308C\u3092\u66F8\u304B\u306A\u3051\u308C\u3070\u3001${t.follow.from.replace(/^color\./, "")} \u304B\u3089\u4F5C\u308B\uFF09` : "";
      out.push(`  ${name}: ${v("light")} / ${v("dark")}  ${t.description}${follow}`);
    }
    return { code: 0, out, err };
  }
  if (command === "check") {
    if (!hasTheme) {
      if (hasSnippet) {
        err.push(`${LOCAL_SNIPPET_FILE} \u304C\u3042\u308B\u306E\u306B ${THEME_FILE} \u304C\u3042\u308A\u307E\u305B\u3093\uFF08\u8272\u3092\u623B\u3059\u306A\u3089\u30B9\u30CB\u30DA\u30C3\u30C8\u3082\u6D88\u3057\u3001appearance.json \u304B\u3089\u5916\u3059\uFF09`);
        return { code: 1, out, err };
      }
      out.push(`\u57FA\u672C\u306E\u8272: ${THEME_FILE} \u304C\u306A\u3044\u306E\u3067\u3001\u4E0A\u6D41\u306E\u8272\u306E\u307E\u307E`);
      return { code: 0, out, err };
    }
    const { themed, problems } = load(root2, tokens);
    if (!themed) {
      err.push(...problems);
      return { code: 1, out, err };
    }
    const expected = themeSnippet(tokens, themed);
    const actual = hasSnippet ? readFileSync(join(root2, LOCAL_SNIPPET_FILE), "utf8") : null;
    if (actual !== expected) {
      err.push(`${LOCAL_SNIPPET_FILE} \u304C ${THEME_FILE} \u304B\u3089\u4F5C\u3063\u305F\u3082\u306E\u3068\u9055\u3044\u307E\u3059\uFF08node .kit/bin/theme.mjs build \u3067\u4F5C\u308A\u76F4\u3059\u3002\u624B\u3067\u76F4\u3055\u306A\u3044\uFF09`);
    }
    err.push(...appearanceProblems(root2, themeAccent(themed)));
    if (err.length > 0) return { code: 1, out, err };
    out.push("\u57FA\u672C\u306E\u8272: OK");
    return { code: 0, out, err };
  }
  if (command === "build") {
    if (!hasTheme) {
      err.push(`${THEME_FILE} \u304C\u3042\u308A\u307E\u305B\u3093\u3002\u4E0A\u66F8\u304D\u3059\u308B\u8272\u3092\u66F8\u3044\u3066\u304B\u3089\u5B9F\u884C\u3059\u308B\uFF08node .kit/bin/theme.mjs list \u3067\u4E00\u89A7\uFF09`);
      return { code: 1, out, err };
    }
    const { themed, problems } = load(root2, tokens);
    if (!themed) {
      err.push("\u30C7\u30B6\u30A4\u30F3\u898F\u7D04\u306B\u5408\u308F\u306A\u3044\u306E\u3067\u3001\u4F55\u3082\u66F8\u304D\u307E\u305B\u3093\u3067\u3057\u305F:", ...problems.map((p) => `  ${p}`));
      return { code: 1, out, err };
    }
    const path = join(root2, LOCAL_SNIPPET_FILE);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, themeSnippet(tokens, themed));
    writeAppearance(root2, themeAccent(themed));
    out.push(`${LOCAL_SNIPPET_FILE} \u3068 ${APPEARANCE} \u3092\u66F8\u304D\u307E\u3057\u305F\u3002Obsidian \u3092\u958B\u304D\u76F4\u3059\u3068\u53CD\u6620\u3055\u308C\u307E\u3059`);
    if (existsSync(join(root2, "slide"))) out.push("\u30B9\u30E9\u30A4\u30C9\u306E primary \u3082\u5909\u308F\u308A\u307E\u3059\u3002node .kit/bin/slide.mjs build --all \u3067\u30D3\u30EB\u30C9\u3057\u76F4\u3057\u3001index.html \u3082\u4E00\u7DD2\u306B\u30B3\u30DF\u30C3\u30C8\u3057\u3066\u304F\u3060\u3055\u3044");
    return { code: 0, out, err };
  }
  err.push("\u4F7F\u3044\u65B9: node .kit/bin/theme.mjs <list | check | build>");
  return { code: 1, out, err };
}

// cli/theme.ts
var root = process.env.KIT_VAULT_ROOT ?? fileURLToPath(new URL("../../", import.meta.url));
var result = runTheme(process.argv.slice(2), root, loadTokens(tokens_default));
for (const line of result.out) console.log(line);
for (const line of result.err) console.error(line);
process.exit(result.code);
