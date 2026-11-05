// Individually authored gamuts, area pairings and validated source-space anchors.
// Shoot House retains its separately approved palette and geometry ownership.
export const MAP_ART_PROFILES={
  "reservoir": {
    "name": "Lagoon & aged brass",
    "colors": [
      "#397E88",
      "#B79A59",
      "#D1C7AA",
      "#43546E"
    ],
    "floor": "#60747B",
    "ink": "#253941",
    "sky": [
      "#627D98",
      "#9EB9CA",
      "#DBDBC4",
      "#EEE1B2"
    ],
    "areas": [
      {
        "id": "pumps",
        "name": "Pump gallery",
        "seeds": [
          [
            31,
            31,
            -8
          ],
          [
            31,
            31,
            8
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "electrical",
        "name": "Electrical gallery",
        "seeds": [
          [
            -31,
            31,
            -8
          ],
          [
            -31,
            31,
            8
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "dado"
      },
      {
        "id": "filtration",
        "name": "Filtration",
        "seeds": [
          [
            0,
            34,
            -36
          ],
          [
            0,
            14,
            -38
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "pilaster"
      },
      {
        "id": "valves",
        "name": "Valve hall",
        "seeds": [
          [
            0,
            34,
            36
          ],
          [
            0,
            14,
            38
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "frieze"
      },
      {
        "id": "basin",
        "name": "Reservoir basin",
        "seeds": [
          [
            0,
            2,
            -18
          ],
          [
            0,
            2,
            18
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "datum"
      },
      {
        "id": "crossing",
        "name": "Transfer bridge",
        "seeds": [
          [
            0,
            14,
            1
          ],
          [
            -3,
            34,
            -6
          ],
          [
            3,
            34,
            6
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "dado",
        "viewNames": [
          "Transfer bridge",
          "Transfer bridge / upper west",
          "Transfer bridge / upper east"
        ]
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      2,
      14,
      31,
      34
    ]
  },
  "rust": {
    "name": "Sienna, violet smoke & lichen",
    "colors": [
      "#AB5D40",
      "#746080",
      "#C4AB80",
      "#999B79"
    ],
    "floor": "#716B62",
    "ink": "#34343E",
    "sky": [
      "#74738B",
      "#B3AFBC",
      "#D9C697",
      "#E7D6B4"
    ],
    "areas": [
      {
        "id": "tower",
        "name": "Process tower",
        "seeds": [
          [
            2,
            1.172,
            -3
          ],
          [
            1,
            8.25,
            3
          ],
          [
            2,
            14.375,
            -8
          ],
          [
            6,
            20.313,
            -1
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "datum",
        "viewNames": [
          "Process tower",
          "Process tower / mid deck",
          "Process tower / high deck",
          "Process tower / crown"
        ]
      },
      {
        "id": "pipes",
        "name": "Pipe rack",
        "seeds": [
          [
            5,
            1.286,
            -21
          ],
          [
            -8,
            1.427,
            -15
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "loading",
        "name": "Loading apron",
        "seeds": [
          [
            5,
            1.352,
            25
          ],
          [
            24,
            1.461,
            15
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "dado",
        "viewTarget": [
          2,
          5,
          -3
        ]
      },
      {
        "id": "service",
        "name": "Service plant",
        "seeds": [
          [
            -25,
            1.363,
            0
          ],
          [
            25,
            1.115,
            -12
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "pilaster"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      1.115,
      8.25,
      14.375,
      20.313
    ],
    "heroView": "loading"
  },
  "shipment": {
    "name": "Dock blue, persimmon & canvas",
    "colors": [
      "#385F79",
      "#BD634B",
      "#729C91",
      "#D6C9AE"
    ],
    "floor": "#687982",
    "ink": "#273C48",
    "sky": [
      "#6A87A0",
      "#ADC7CF",
      "#D8D8C2",
      "#EEE0B6"
    ],
    "areas": [
      {
        "id": "north",
        "name": "North stacks",
        "seeds": [
          [
            -8,
            0.101,
            -11
          ],
          [
            10,
            0.065,
            -13
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "dado"
      },
      {
        "id": "south",
        "name": "South stacks",
        "seeds": [
          [
            8,
            0.014,
            11
          ],
          [
            -10,
            0.201,
            13
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "datum"
      },
      {
        "id": "east",
        "name": "Power bay",
        "seeds": [
          [
            21,
            0,
            0
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "pilaster"
      },
      {
        "id": "west",
        "name": "Dispatch",
        "seeds": [
          [
            -20,
            0,
            0
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "frieze"
      },
      {
        "id": "crossing",
        "name": "Central crossing",
        "seeds": [
          [
            0,
            0,
            0
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "datum"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      0
    ]
  },
  "nuketown": {
    "name": "Flamingo, pool enamel & vanilla",
    "colors": [
      "#C67E80",
      "#498D98",
      "#D9C9A2",
      "#645565"
    ],
    "floor": "#788477",
    "ink": "#303C45",
    "sky": [
      "#709AB2",
      "#B7D2D7",
      "#E5D6B0",
      "#F1E2BD"
    ],
    "areas": [
      {
        "id": "west-house",
        "name": "West house",
        "seeds": [
          [
            -29,
            0.719,
            0
          ],
          [
            -29,
            4.969,
            0
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "east-house",
        "name": "East house",
        "seeds": [
          [
            30,
            0.719,
            0
          ],
          [
            30,
            4.969,
            3
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "west-garden",
        "name": "West garden",
        "seeds": [
          [
            -58,
            0.469,
            -5
          ],
          [
            -53,
            0.5,
            13
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "dado"
      },
      {
        "id": "east-garden",
        "name": "East garden",
        "seeds": [
          [
            59,
            0.5,
            6
          ],
          [
            51,
            0.625,
            -14
          ]
        ],
        "primary": 2,
        "accent": 1,
        "style": "dado"
      },
      {
        "id": "crossing",
        "name": "Transit crossing",
        "seeds": [
          [
            -1,
            0.39,
            0
          ]
        ],
        "primary": 1,
        "accent": 0,
        "style": "datum"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      0.39,
      4.969
    ]
  },
  "killhouse": {
    "name": "Workshop amber & ink blue",
    "colors": [
      "#B68C52",
      "#3F586F",
      "#A26150",
      "#CEC2A6"
    ],
    "floor": "#706F6C",
    "ink": "#283D4A",
    "sky": [
      "#72899C",
      "#B0BFBE",
      "#DCCFAE",
      "#E7D8B3"
    ],
    "areas": [
      {
        "id": "west",
        "name": "West drill bays",
        "seeds": [
          [
            -12,
            0.375,
            7
          ],
          [
            -13,
            0.375,
            -10
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "dado"
      },
      {
        "id": "east",
        "name": "East drill bays",
        "seeds": [
          [
            13,
            0.375,
            -8
          ],
          [
            13,
            0.375,
            12
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "pilaster"
      },
      {
        "id": "tower",
        "name": "Observation",
        "seeds": [
          [
            0,
            0.375,
            1
          ],
          [
            -1,
            1.808,
            0
          ]
        ],
        "primary": 3,
        "accent": 2,
        "style": "datum"
      },
      {
        "id": "briefing",
        "name": "Briefing apron",
        "seeds": [
          [
            8,
            0.375,
            -30
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "frieze"
      },
      {
        "id": "entry",
        "name": "Range entry",
        "seeds": [
          [
            -10,
            0.375,
            30
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      0.375,
      1.808
    ]
  },
  "vacant": {
    "name": "Celadon, wine & worn porcelain",
    "colors": [
      "#71988C",
      "#935C6C",
      "#B4A580",
      "#D3D0B7"
    ],
    "floor": "#68726D",
    "ink": "#303B43",
    "sky": [
      "#657F90",
      "#A4B8BB",
      "#C8CDBF",
      "#DED7B9"
    ],
    "areas": [
      {
        "id": "yard",
        "name": "Service yard",
        "seeds": [
          [
            -46,
            1.002,
            0
          ]
        ],
        "primary": 2,
        "accent": 1,
        "style": "dado"
      },
      {
        "id": "warehouse",
        "name": "Warehouse",
        "seeds": [
          [
            -29,
            0.987,
            -31
          ],
          [
            -8,
            1.37,
            -28
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "pilaster"
      },
      {
        "id": "records",
        "name": "Records & stores",
        "seeds": [
          [
            30,
            3,
            -9
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "frieze"
      },
      {
        "id": "maintenance",
        "name": "Maintenance",
        "seeds": [
          [
            -18,
            3,
            20
          ],
          [
            35,
            3,
            28
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "datum"
      },
      {
        "id": "offices",
        "name": "Operations",
        "seeds": [
          [
            -2,
            3,
            -12
          ],
          [
            5,
            3,
            4
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "dado"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      0.987,
      3
    ]
  },
  "showdown": {
    "name": "Lapis, pomegranate & travertine",
    "colors": [
      "#486C91",
      "#A96870",
      "#C2A05D",
      "#D6C6A4"
    ],
    "floor": "#88877C",
    "ink": "#35404E",
    "sky": [
      "#708EA6",
      "#AFC7D0",
      "#E3CF9D",
      "#EFDEB4"
    ],
    "areas": [
      {
        "id": "court",
        "name": "Transfer court",
        "seeds": [
          [
            1,
            1.5,
            3
          ],
          [
            -3,
            1.5,
            -12
          ],
          [
            0,
            2,
            19
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "frieze"
      },
      {
        "id": "west",
        "name": "West arcade",
        "seeds": [
          [
            -27,
            2,
            0
          ],
          [
            -27,
            1.918,
            -21
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "pilaster"
      },
      {
        "id": "east",
        "name": "East arcade",
        "seeds": [
          [
            27,
            2.009,
            0
          ],
          [
            26,
            2,
            21
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "frieze"
      },
      {
        "id": "north",
        "name": "North gallery",
        "seeds": [
          [
            -10,
            1.438,
            -46
          ],
          [
            10,
            1.19,
            -47
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "dado"
      },
      {
        "id": "south",
        "name": "South gallery",
        "seeds": [
          [
            -10,
            2,
            46
          ],
          [
            10,
            2,
            46
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "dado"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      1.19,
      1.918
    ]
  },
  "firingrange": {
    "naturalSurfaces": true,
    "name": "Field sage, russet & blue steel",
    "colors": [
      "#7D936F",
      "#AF644A",
      "#526F8B",
      "#C6BB98"
    ],
    "floor": "#777C6C",
    "ink": "#35464A",
    "sky": [
      "#6B8B9E",
      "#A4C0C3",
      "#C8CFAE",
      "#E5D5A4"
    ],
    "areas": [
      {
        "id": "timber",
        "name": "Timber range",
        "seeds": [
          [
            -28,
            2.649,
            -10
          ],
          [
            -35,
            2.794,
            -33
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "frieze"
      },
      {
        "id": "containers",
        "name": "Container lab",
        "seeds": [
          [
            -13,
            2.75,
            -41
          ],
          [
            7,
            2.875,
            -32
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "datum"
      },
      {
        "id": "workshop",
        "name": "Range workshop",
        "seeds": [
          [
            -10,
            2.39,
            2
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "dado"
      },
      {
        "id": "tower",
        "name": "Observation range",
        "seeds": [
          [
            -23,
            0.406,
            32
          ],
          [
            -27,
            4.688,
            36
          ]
        ],
        "primary": 2,
        "accent": 1,
        "style": "pilaster"
      },
      {
        "id": "yard",
        "name": "Drill yard",
        "seeds": [
          [
            24,
            2.523,
            2
          ],
          [
            16,
            0.5,
            25
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      0.406,
      2.39,
      4.688
    ]
  },
  "hijacked": {
    "name": "Marine navy, teak & sea glass",
    "colors": [
      "#365578",
      "#AD805D",
      "#A1BCB3",
      "#DBD1B7"
    ],
    "floor": "#857E73",
    "ink": "#273B4C",
    "sky": [
      "#6F9BB4",
      "#AACDD5",
      "#D5E3D5",
      "#EFDEB3"
    ],
    "areas": [
      {
        "id": "service",
        "name": "Service passage",
        "seeds": [
          [
            -3,
            3.953,
            -4
          ],
          [
            19.5,
            4.984,
            0
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "dado"
      },
      {
        "id": "aft",
        "name": "Aft deck",
        "seeds": [
          [
            -53,
            6.531,
            0
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "datum"
      },
      {
        "id": "salon",
        "name": "Aft operations",
        "seeds": [
          [
            -28,
            8.904,
            0
          ],
          [
            -28,
            13.228,
            0
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "frieze"
      },
      {
        "id": "bow",
        "name": "Forward deck",
        "seeds": [
          [
            54,
            10.016,
            0
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "datum"
      },
      {
        "id": "bridge",
        "name": "Bridge systems",
        "seeds": [
          [
            30,
            10.393,
            0
          ],
          [
            33,
            14.313,
            0
          ]
        ],
        "primary": 2,
        "accent": 1,
        "style": "pilaster"
      },
      {
        "id": "crossing",
        "name": "Deck transfer",
        "seeds": [
          [
            0,
            10.271,
            0
          ],
          [
            1,
            10.393,
            9.5
          ]
        ],
        "primary": 1,
        "accent": 0,
        "style": "dado"
      }
    ],
    "lighting": {
      "hemi": 2.25,
      "environment": 0.48
    },
    "datums": [
      3.953,
      4.984,
      6.531,
      8.904,
      10.016,
      13.228,
      14.313
    ]
  },
  "summit": {
    "name": "Glacier, spruce & weathered vermilion",
    "colors": [
      "#7397AA",
      "#3D6762",
      "#B46F58",
      "#BDCBCD"
    ],
    "floor": "#91A4AE",
    "ink": "#2D414E",
    "sky": [
      "#607F9E",
      "#A9C2D2",
      "#D6DFDA",
      "#E8E2C9"
    ],
    "areas": [
      {
        "id": "north",
        "name": "North switchyard",
        "seeds": [
          [
            8,
            6.75,
            -45
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "dado"
      },
      {
        "id": "south",
        "name": "South gantry",
        "seeds": [
          [
            12,
            11,
            53
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "frieze"
      },
      {
        "id": "west",
        "name": "West service",
        "seeds": [
          [
            -16,
            7,
            -19
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "dado"
      },
      {
        "id": "cable",
        "name": "Cable station",
        "seeds": [
          [
            27,
            7,
            5
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "pilaster"
      },
      {
        "id": "control",
        "name": "Control hall",
        "seeds": [
          [
            12,
            7,
            -9
          ],
          [
            9,
            8.869,
            10
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "datum"
      }
    ],
    "lighting": {
      "hemi": 2.05,
      "environment": 0.4
    },
    "datums": [
      6.75,
      8.869,
      11
    ]
  },
  "siege": {
    "name": "Heather stone, verdigris & old mortar",
    "colors": [
      "#826C83",
      "#4E8176",
      "#C0AE80",
      "#BA9187"
    ],
    "floor": "#747485",
    "ink": "#303849",
    "sky": [
      "#667B9C",
      "#ADB8CE",
      "#D4C8C3",
      "#E5D4B7"
    ],
    "areas": [
      {
        "id": "west",
        "name": "West keep",
        "seeds": [
          [
            -33,
            19.25,
            -8
          ],
          [
            -28,
            11.5,
            2
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "east",
        "name": "East keep",
        "seeds": [
          [
            33,
            15,
            -8
          ],
          [
            21,
            4,
            2
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "pilaster"
      },
      {
        "id": "north",
        "name": "North rampart",
        "seeds": [
          [
            -13,
            11.5,
            -19
          ],
          [
            11,
            11.5,
            -19
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "datum"
      },
      {
        "id": "south",
        "name": "South court",
        "seeds": [
          [
            -17,
            4,
            19
          ],
          [
            9,
            4.23,
            16.5
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "frieze"
      },
      {
        "id": "crossing",
        "name": "Gate transfer",
        "seeds": [
          [
            0,
            4,
            0
          ],
          [
            8.5,
            11.5,
            -5.5
          ]
        ],
        "primary": 2,
        "accent": 1,
        "style": "pilaster"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      4,
      11.5,
      15,
      19.25
    ]
  },
  "mutiny": {
    "name": "Oxblood, storm enamel & industrial ivory",
    "colors": [
      "#954E61",
      "#517695",
      "#C9C2A8",
      "#548D83"
    ],
    "floor": "#64707D",
    "ink": "#2E3547",
    "sky": [
      "#656E92",
      "#ADB5C7",
      "#D4C3B7",
      "#E8D3AE"
    ],
    "areas": [
      {
        "id": "lower",
        "name": "Lower process works",
        "seeds": [
          [
            -9,
            6,
            4.5
          ],
          [
            20,
            5.75,
            20
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "dado"
      },
      {
        "id": "east",
        "name": "East transfer",
        "seeds": [
          [
            39,
            10.5,
            9
          ],
          [
            40,
            11.25,
            -14
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "west",
        "name": "West transfer",
        "seeds": [
          [
            -38,
            7.5,
            -8
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "pilaster"
      },
      {
        "id": "loading",
        "name": "Loading hall",
        "seeds": [
          [
            20,
            6,
            26
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "datum"
      },
      {
        "id": "core",
        "name": "Process gantry",
        "seeds": [
          [
            -9,
            11.875,
            -9.5
          ],
          [
            2,
            7.5,
            -1
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      5.75,
      7.5,
      10.5,
      11.25
    ]
  },
  "bravery": {
    "name": "Aubergine, brushed brass & mineral cyan",
    "colors": [
      "#765D86",
      "#BE9F61",
      "#67999E",
      "#D3C5A3"
    ],
    "floor": "#686A7D",
    "ink": "#353548",
    "sky": [
      "#73769D",
      "#B4B4CD",
      "#D9CBC1",
      "#E6D8B9"
    ],
    "areas": [
      {
        "id": "lower",
        "name": "Lower engine room",
        "seeds": [
          [
            3,
            3.5,
            7
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "dado"
      },
      {
        "id": "service",
        "name": "Service duct",
        "seeds": [
          [
            -16,
            6,
            -25
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "datum"
      },
      {
        "id": "north",
        "name": "North operations",
        "seeds": [
          [
            3,
            9.5,
            -23
          ],
          [
            -18.5,
            16,
            -26
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "frieze"
      },
      {
        "id": "south",
        "name": "South maintenance",
        "seeds": [
          [
            3,
            9.375,
            18
          ]
        ],
        "primary": 1,
        "accent": 0,
        "style": "pilaster"
      },
      {
        "id": "core",
        "name": "Engine transfer",
        "seeds": [
          [
            -12,
            18,
            3
          ],
          [
            0,
            9,
            0
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      3.5,
      6,
      9,
      16,
      18
    ]
  },
  "ef-showdown": {
    "name": "Apricot plaster, periwinkle & peacock",
    "colors": [
      "#C28C6A",
      "#7B88B1",
      "#437B82",
      "#CCBBA0"
    ],
    "floor": "#7D797B",
    "ink": "#394257",
    "sky": [
      "#7889AB",
      "#B8C7D5",
      "#E0CBB4",
      "#EAD9B9"
    ],
    "areas": [
      {
        "id": "north",
        "name": "North workshops",
        "seeds": [
          [
            -4,
            3.855,
            -11
          ],
          [
            -20,
            9.5,
            -11
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "south",
        "name": "South stores",
        "seeds": [
          [
            -4,
            3.692,
            10
          ],
          [
            15,
            4.034,
            8
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "dado"
      },
      {
        "id": "west",
        "name": "West arcade",
        "seeds": [
          [
            -17,
            3.875,
            -2
          ],
          [
            -17,
            3.796,
            9
          ]
        ],
        "primary": 3,
        "accent": 2,
        "style": "pilaster"
      },
      {
        "id": "east",
        "name": "East operations",
        "seeds": [
          [
            15,
            3.716,
            2
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "datum"
      },
      {
        "id": "street",
        "name": "Main transfer",
        "seeds": [
          [
            0,
            3.792,
            0
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      3.692,
      9.5
    ]
  },
  "delta-station": {
    "name": "Cobalt ceramic, dusty rose & bronze",
    "colors": [
      "#4C6DA0",
      "#B37D8B",
      "#C6CED2",
      "#A89063"
    ],
    "floor": "#646E86",
    "ink": "#29364F",
    "sky": [
      "#5A6F98",
      "#9BAFCE",
      "#C5C4D1",
      "#E0CAB5"
    ],
    "areas": [
      {
        "id": "north",
        "name": "North station",
        "seeds": [
          [
            -11,
            6,
            -50
          ],
          [
            11,
            6,
            -50
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "dado"
      },
      {
        "id": "south",
        "name": "South station",
        "seeds": [
          [
            -11,
            6,
            50
          ],
          [
            11,
            6,
            50
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "upper",
        "name": "Upper transfer",
        "seeds": [
          [
            -19,
            9.07,
            -51
          ],
          [
            19,
            9.07,
            51
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "datum"
      },
      {
        "id": "bridge",
        "name": "Station crossing",
        "seeds": [
          [
            3,
            5,
            0
          ],
          [
            -2,
            8.695,
            8.5
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "pilaster"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      5,
      6,
      8.695
    ]
  },
  "beta-station": {
    "name": "Malachite, amber & lavender smoke",
    "colors": [
      "#5C8D7E",
      "#B79655",
      "#9290B0",
      "#CEC6AA"
    ],
    "floor": "#68756F",
    "ink": "#303F43",
    "sky": [
      "#697F91",
      "#AABFC0",
      "#CDD2BC",
      "#E2D6B3"
    ],
    "areas": [
      {
        "id": "north",
        "name": "North systems",
        "seeds": [
          [
            -11,
            6,
            -50
          ],
          [
            11,
            6,
            -50
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "pilaster"
      },
      {
        "id": "south",
        "name": "South systems",
        "seeds": [
          [
            -11,
            6,
            50
          ],
          [
            11,
            6,
            50
          ]
        ],
        "primary": 1,
        "accent": 0,
        "style": "dado"
      },
      {
        "id": "upper",
        "name": "Upper gantries",
        "seeds": [
          [
            -19.5,
            7.013,
            -52
          ],
          [
            19.5,
            7.013,
            52
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "datum"
      },
      {
        "id": "bridge",
        "name": "Beta crossing",
        "seeds": [
          [
            0,
            6,
            1.5
          ],
          [
            0,
            10,
            0
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      6,
      7.013,
      10
    ]
  },
  "forge2": {
    "name": "Iron orange, wine slag & furnace teal",
    "colors": [
      "#BB7047",
      "#487983",
      "#7F505B",
      "#C9BDA6"
    ],
    "floor": "#666C72",
    "ink": "#323744",
    "sky": [
      "#687887",
      "#A4B2B6",
      "#CDC8B7",
      "#E2C9A0"
    ],
    "areas": [
      {
        "id": "lower",
        "name": "Lower forge",
        "seeds": [
          [
            -13,
            7,
            -1
          ],
          [
            -20.5,
            9.598,
            -2
          ]
        ],
        "primary": 2,
        "accent": 3,
        "style": "dado"
      },
      {
        "id": "west",
        "name": "West transfer",
        "seeds": [
          [
            -25,
            15.75,
            -16.5
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "pilaster"
      },
      {
        "id": "north",
        "name": "North core",
        "seeds": [
          [
            20,
            24.75,
            -33
          ],
          [
            -13,
            26,
            -45
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "frieze"
      },
      {
        "id": "south",
        "name": "South reactor",
        "seeds": [
          [
            0,
            14,
            22.5
          ],
          [
            14.5,
            25.75,
            20.5
          ]
        ],
        "primary": 1,
        "accent": 0,
        "style": "datum"
      },
      {
        "id": "middle",
        "name": "Core gantry",
        "seeds": [
          [
            -10,
            25.75,
            5
          ],
          [
            23.5,
            25.5,
            -3
          ]
        ],
        "primary": 0,
        "accent": 3,
        "style": "pilaster"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      7,
      9.598,
      14,
      15.75,
      24.75,
      25.5
    ]
  },
  "forge1": {
    "name": "Indigo enamel, flame copper & olive ash",
    "colors": [
      "#52638F",
      "#BA805B",
      "#A5AC88",
      "#C9C5B4"
    ],
    "floor": "#68758A",
    "ink": "#303B50",
    "sky": [
      "#617795",
      "#A4BAD0",
      "#D0D0C3",
      "#E3D0B1"
    ],
    "areas": [
      {
        "id": "north",
        "name": "North forge",
        "seeds": [
          [
            -13,
            4,
            -62
          ],
          [
            38,
            4,
            -65
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "dado"
      },
      {
        "id": "south",
        "name": "South forge",
        "seeds": [
          [
            13,
            4,
            62
          ],
          [
            -38,
            4,
            65
          ]
        ],
        "primary": 3,
        "accent": 0,
        "style": "frieze"
      },
      {
        "id": "west",
        "name": "West power",
        "seeds": [
          [
            -26.5,
            2.75,
            -4
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "pilaster"
      },
      {
        "id": "east",
        "name": "East power",
        "seeds": [
          [
            27,
            2.75,
            4
          ]
        ],
        "primary": 1,
        "accent": 3,
        "style": "datum"
      },
      {
        "id": "crossing",
        "name": "Forge crossing",
        "seeds": [
          [
            0,
            4,
            0
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "pilaster"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      2.75,
      4
    ]
  },
  "blast-radius": {
    "name": "Duck egg, saffron shield & blackcurrant",
    "colors": [
      "#82A6A1",
      "#BE9B4D",
      "#755571",
      "#D1C5AA"
    ],
    "floor": "#71828A",
    "ink": "#34434E",
    "sky": [
      "#7A88A5",
      "#B7C5D0",
      "#D8D4C5",
      "#E9D9B6"
    ],
    "areas": [
      {
        "id": "upper",
        "name": "Upper control",
        "seeds": [
          [
            -5,
            14.5,
            0
          ]
        ],
        "primary": 0,
        "accent": 2,
        "style": "frieze"
      },
      {
        "id": "south",
        "name": "South test hall",
        "seeds": [
          [
            -22,
            4.5,
            21
          ],
          [
            -1.5,
            4.25,
            30
          ]
        ],
        "primary": 1,
        "accent": 2,
        "style": "dado"
      },
      {
        "id": "north",
        "name": "North pressure well",
        "seeds": [
          [
            0,
            4.5,
            -21
          ],
          [
            -26,
            4.25,
            -8
          ]
        ],
        "primary": 2,
        "accent": 0,
        "style": "pilaster"
      },
      {
        "id": "west",
        "name": "West test room",
        "seeds": [
          [
            -21,
            4.25,
            0
          ]
        ],
        "primary": 3,
        "accent": 1,
        "style": "datum"
      },
      {
        "id": "core",
        "name": "Central pressure hall",
        "seeds": [
          [
            0,
            4.25,
            0
          ],
          [
            14,
            4.5,
            -3
          ],
          [
            26,
            4.5,
            -7
          ]
        ],
        "primary": 0,
        "accent": 1,
        "style": "frieze"
      }
    ],
    "lighting": {
      "hemi": 2.15,
      "environment": 0.45
    },
    "datums": [
      4.25,
      14.5
    ]
  }
};
