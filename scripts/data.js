const STORAGE_KEY = "vvgu-ticketing-data-v4";
const SESSION_KEY = "vvgu-ticketing-session-id";
const DEVICE_KEY = "vvgu-ticketing-device-id";
const HOLD_TTL_MS = 10 * 60 * 1000;
export const CUSTOM_LAYOUT_SIZE = 70;
const EMBEDDED_CUSTOM_LAYOUT_RAW = String.raw`{"rows":70,"cols":70,"cells":[{"x":39,"y":67},{"x":21,"y":67},{"x":40,"y":67},{"x":41,"y":67},{"x":22,"y":67},{"x":23,"y":67},{"x":42,"y":67},{"x":24,"y":67},{"x":25,"y":67},{"x":43,"y":67},{"x":44,"y":67},{"x":45,"y":67},{"x":46,"y":67},{"x":47,"y":67},{"x":26,"y":67},{"x":27,"y":67},{"x":28,"y":67},{"x":29,"y":67},{"x":48,"y":67},{"x":49,"y":67},{"x":50,"y":67},{"x":51,"y":67},{"x":30,"y":67},{"x":31,"y":67},{"x":32,"y":67},{"x":33,"y":67},{"x":38,"y":67},{"x":20,"y":67},{"x":37,"y":67},{"x":19,"y":67},{"x":36,"y":67},{"x":18,"y":67},{"x":17,"y":66},{"x":18,"y":66},{"x":19,"y":66},{"x":20,"y":66},{"x":21,"y":66},{"x":22,"y":66},{"x":23,"y":66},{"x":24,"y":66},{"x":25,"y":66},{"x":26,"y":66},{"x":27,"y":66},{"x":32,"y":66},{"x":33,"y":66},{"x":31,"y":66},{"x":30,"y":66},{"x":29,"y":66},{"x":28,"y":66},{"x":36,"y":66},{"x":37,"y":66},{"x":38,"y":66},{"x":39,"y":66},{"x":40,"y":66},{"x":41,"y":66},{"x":42,"y":66},{"x":43,"y":66},{"x":44,"y":66},{"x":45,"y":66},{"x":46,"y":66},{"x":47,"y":66},{"x":48,"y":66},{"x":49,"y":66},{"x":50,"y":66},{"x":51,"y":66},{"x":52,"y":66},{"x":33,"y":65},{"x":32,"y":65},{"x":31,"y":65},{"x":30,"y":65},{"x":29,"y":65},{"x":28,"y":65},{"x":27,"y":65},{"x":26,"y":65},{"x":25,"y":65},{"x":24,"y":65},{"x":23,"y":65},{"x":22,"y":65},{"x":21,"y":65},{"x":20,"y":65},{"x":19,"y":65},{"x":18,"y":65},{"x":17,"y":65},{"x":36,"y":65},{"x":37,"y":65},{"x":38,"y":65},{"x":39,"y":65},{"x":40,"y":65},{"x":41,"y":65},{"x":42,"y":65},{"x":43,"y":65},{"x":44,"y":65},{"x":45,"y":65},{"x":46,"y":65},{"x":47,"y":65},{"x":48,"y":65},{"x":49,"y":65},{"x":50,"y":65},{"x":51,"y":65},{"x":52,"y":65},{"x":33,"y":64},{"x":32,"y":64},{"x":31,"y":64},{"x":30,"y":64},{"x":29,"y":64},{"x":28,"y":64},{"x":26,"y":64},{"x":25,"y":64},{"x":24,"y":64},{"x":23,"y":64},{"x":22,"y":64},{"x":21,"y":64},{"x":20,"y":64},{"x":19,"y":64},{"x":18,"y":64},{"x":17,"y":64},{"x":16,"y":64},{"x":27,"y":64},{"x":36,"y":64},{"x":37,"y":64},{"x":38,"y":64},{"x":42,"y":64},{"x":43,"y":64},{"x":44,"y":64},{"x":45,"y":64},{"x":46,"y":64},{"x":47,"y":64},{"x":48,"y":64},{"x":49,"y":64},{"x":50,"y":64},{"x":51,"y":64},{"x":52,"y":64},{"x":53,"y":64},{"x":39,"y":64},{"x":40,"y":64},{"x":41,"y":64},{"x":33,"y":63},{"x":31,"y":63},{"x":30,"y":63},{"x":24,"y":63},{"x":22,"y":63},{"x":21,"y":63},{"x":20,"y":63},{"x":19,"y":63},{"x":18,"y":63},{"x":32,"y":63},{"x":29,"y":63},{"x":27,"y":63},{"x":26,"y":63},{"x":25,"y":63},{"x":23,"y":63},{"x":28,"y":63},{"x":17,"y":63},{"x":16,"y":63},{"x":15,"y":63},{"x":15,"y":62},{"x":15,"y":61},{"x":15,"y":60},{"x":15,"y":59},{"x":15,"y":58},{"x":15,"y":57},{"x":15,"y":56},{"x":15,"y":55},{"x":16,"y":55},{"x":17,"y":55},{"x":18,"y":55},{"x":19,"y":55},{"x":20,"y":55},{"x":21,"y":55},{"x":22,"y":55},{"x":23,"y":55},{"x":24,"y":55},{"x":25,"y":55},{"x":26,"y":55},{"x":27,"y":55},{"x":28,"y":55},{"x":29,"y":55},{"x":30,"y":55},{"x":33,"y":55},{"x":32,"y":55},{"x":31,"y":55},{"x":33,"y":56},{"x":33,"y":57},{"x":33,"y":58},{"x":33,"y":59},{"x":33,"y":60},{"x":33,"y":61},{"x":33,"y":62},{"x":32,"y":62},{"x":31,"y":62},{"x":30,"y":62},{"x":29,"y":62},{"x":28,"y":62},{"x":27,"y":62},{"x":26,"y":62},{"x":25,"y":62},{"x":24,"y":62},{"x":23,"y":62},{"x":22,"y":62},{"x":21,"y":62},{"x":20,"y":62},{"x":19,"y":62},{"x":18,"y":62},{"x":17,"y":62},{"x":16,"y":62},{"x":16,"y":61},{"x":16,"y":60},{"x":16,"y":59},{"x":16,"y":58},{"x":16,"y":57},{"x":16,"y":56},{"x":17,"y":56},{"x":18,"y":56},{"x":19,"y":56},{"x":20,"y":56},{"x":21,"y":56},{"x":22,"y":56},{"x":23,"y":56},{"x":24,"y":56},{"x":25,"y":56},{"x":26,"y":56},{"x":27,"y":57},{"x":28,"y":57},{"x":29,"y":57},{"x":30,"y":57},{"x":31,"y":56},{"x":32,"y":56},{"x":30,"y":56},{"x":29,"y":56},{"x":28,"y":56},{"x":27,"y":56},{"x":17,"y":57},{"x":18,"y":57},{"x":19,"y":57},{"x":20,"y":57},{"x":21,"y":57},{"x":22,"y":57},{"x":23,"y":57},{"x":24,"y":57},{"x":25,"y":57},{"x":26,"y":57},{"x":32,"y":57},{"x":31,"y":57},{"x":32,"y":58},{"x":32,"y":59},{"x":32,"y":60},{"x":32,"y":61},{"x":31,"y":61},{"x":30,"y":61},{"x":29,"y":61},{"x":28,"y":61},{"x":27,"y":61},{"x":26,"y":61},{"x":25,"y":61},{"x":24,"y":61},{"x":23,"y":61},{"x":22,"y":61},{"x":21,"y":61},{"x":20,"y":61},{"x":19,"y":61},{"x":18,"y":61},{"x":17,"y":61},{"x":17,"y":60},{"x":17,"y":59},{"x":17,"y":58},{"x":18,"y":58},{"x":19,"y":58},{"x":20,"y":58},{"x":21,"y":58},{"x":22,"y":58},{"x":23,"y":58},{"x":24,"y":58},{"x":25,"y":58},{"x":26,"y":58},{"x":27,"y":58},{"x":28,"y":58},{"x":29,"y":58},{"x":30,"y":58},{"x":31,"y":58},{"x":31,"y":59},{"x":31,"y":60},{"x":30,"y":60},{"x":29,"y":60},{"x":28,"y":60},{"x":27,"y":60},{"x":26,"y":60},{"x":25,"y":60},{"x":24,"y":60},{"x":23,"y":60},{"x":22,"y":60},{"x":21,"y":60},{"x":20,"y":60},{"x":19,"y":60},{"x":18,"y":60},{"x":18,"y":59},{"x":19,"y":59},{"x":20,"y":59},{"x":21,"y":59},{"x":22,"y":59},{"x":23,"y":59},{"x":24,"y":59},{"x":25,"y":59},{"x":26,"y":59},{"x":27,"y":59},{"x":28,"y":59},{"x":29,"y":59},{"x":30,"y":59},{"x":36,"y":63},{"x":36,"y":62},{"x":36,"y":61},{"x":36,"y":60},{"x":36,"y":59},{"x":36,"y":58},{"x":36,"y":57},{"x":36,"y":56},{"x":36,"y":55},{"x":37,"y":55},{"x":38,"y":55},{"x":39,"y":55},{"x":40,"y":55},{"x":41,"y":55},{"x":42,"y":55},{"x":43,"y":55},{"x":44,"y":55},{"x":54,"y":63},{"x":54,"y":62},{"x":54,"y":61},{"x":54,"y":60},{"x":54,"y":59},{"x":54,"y":58},{"x":54,"y":57},{"x":54,"y":56},{"x":54,"y":55},{"x":53,"y":55},{"x":52,"y":55},{"x":51,"y":55},{"x":50,"y":55},{"x":49,"y":55},{"x":48,"y":55},{"x":47,"y":55},{"x":46,"y":55},{"x":45,"y":55},{"x":37,"y":63},{"x":39,"y":63},{"x":40,"y":63},{"x":43,"y":63},{"x":44,"y":63},{"x":45,"y":63},{"x":46,"y":63},{"x":47,"y":63},{"x":48,"y":63},{"x":49,"y":63},{"x":50,"y":63},{"x":51,"y":63},{"x":52,"y":63},{"x":53,"y":63},{"x":53,"y":62},{"x":53,"y":61},{"x":53,"y":60},{"x":53,"y":59},{"x":53,"y":58},{"x":53,"y":57},{"x":53,"y":56},{"x":52,"y":56},{"x":51,"y":57},{"x":50,"y":57},{"x":49,"y":57},{"x":48,"y":57},{"x":47,"y":57},{"x":46,"y":57},{"x":45,"y":57},{"x":44,"y":57},{"x":43,"y":57},{"x":39,"y":56},{"x":38,"y":56},{"x":37,"y":56},{"x":37,"y":57},{"x":37,"y":58},{"x":37,"y":59},{"x":37,"y":60},{"x":37,"y":62},{"x":37,"y":61},{"x":38,"y":61},{"x":39,"y":61},{"x":40,"y":61},{"x":41,"y":61},{"x":42,"y":61},{"x":43,"y":61},{"x":44,"y":61},{"x":45,"y":61},{"x":46,"y":61},{"x":47,"y":61},{"x":48,"y":61},{"x":49,"y":61},{"x":50,"y":61},{"x":51,"y":61},{"x":52,"y":61},{"x":39,"y":62},{"x":38,"y":62},{"x":40,"y":62},{"x":41,"y":62},{"x":42,"y":62},{"x":43,"y":62},{"x":44,"y":62},{"x":45,"y":62},{"x":46,"y":62},{"x":47,"y":62},{"x":48,"y":62},{"x":49,"y":62},{"x":50,"y":62},{"x":51,"y":62},{"x":52,"y":62},{"x":41,"y":63},{"x":42,"y":63},{"x":38,"y":63},{"x":38,"y":60},{"x":38,"y":59},{"x":38,"y":58},{"x":38,"y":57},{"x":39,"y":57},{"x":40,"y":56},{"x":41,"y":56},{"x":42,"y":56},{"x":43,"y":56},{"x":44,"y":56},{"x":45,"y":56},{"x":46,"y":56},{"x":47,"y":56},{"x":51,"y":56},{"x":50,"y":56},{"x":49,"y":56},{"x":48,"y":56},{"x":52,"y":57},{"x":52,"y":58},{"x":52,"y":59},{"x":52,"y":60},{"x":51,"y":60},{"x":50,"y":60},{"x":49,"y":60},{"x":48,"y":60},{"x":47,"y":60},{"x":46,"y":60},{"x":45,"y":60},{"x":44,"y":60},{"x":43,"y":60},{"x":42,"y":60},{"x":41,"y":60},{"x":40,"y":60},{"x":39,"y":60},{"x":39,"y":59},{"x":39,"y":58},{"x":40,"y":58},{"x":41,"y":58},{"x":42,"y":58},{"x":43,"y":58},{"x":44,"y":58},{"x":45,"y":58},{"x":46,"y":58},{"x":47,"y":58},{"x":48,"y":58},{"x":49,"y":58},{"x":50,"y":58},{"x":51,"y":58},{"x":51,"y":59},{"x":50,"y":59},{"x":49,"y":59},{"x":48,"y":59},{"x":47,"y":59},{"x":46,"y":59},{"x":45,"y":59},{"x":44,"y":59},{"x":43,"y":59},{"x":42,"y":59},{"x":41,"y":59},{"x":40,"y":59},{"x":40,"y":57},{"x":41,"y":57},{"x":42,"y":57},{"x":15,"y":52},{"x":16,"y":52},{"x":17,"y":52},{"x":18,"y":52},{"x":19,"y":52},{"x":20,"y":52},{"x":21,"y":52},{"x":22,"y":52},{"x":23,"y":52},{"x":24,"y":52},{"x":25,"y":52},{"x":26,"y":52},{"x":27,"y":52},{"x":28,"y":52},{"x":29,"y":52},{"x":30,"y":52},{"x":31,"y":52},{"x":32,"y":52},{"x":33,"y":52},{"x":15,"y":51},{"x":15,"y":50},{"x":15,"y":49},{"x":15,"y":48},{"x":15,"y":47},{"x":15,"y":46},{"x":16,"y":46},{"x":17,"y":46},{"x":18,"y":46},{"x":19,"y":46},{"x":20,"y":46},{"x":21,"y":46},{"x":22,"y":46},{"x":23,"y":46},{"x":24,"y":46},{"x":25,"y":46},{"x":26,"y":46},{"x":27,"y":46},{"x":28,"y":46},{"x":29,"y":46},{"x":30,"y":46},{"x":31,"y":46},{"x":32,"y":46},{"x":33,"y":46},{"x":33,"y":47},{"x":33,"y":48},{"x":33,"y":49},{"x":33,"y":50},{"x":33,"y":51},{"x":36,"y":52},{"x":37,"y":52},{"x":38,"y":52},{"x":39,"y":52},{"x":40,"y":52},{"x":41,"y":52},{"x":42,"y":52},{"x":43,"y":52},{"x":44,"y":52},{"x":45,"y":52},{"x":46,"y":52},{"x":47,"y":52},{"x":48,"y":52},{"x":49,"y":52},{"x":50,"y":52},{"x":51,"y":52},{"x":52,"y":52},{"x":53,"y":52},{"x":54,"y":52},{"x":54,"y":51},{"x":54,"y":50},{"x":54,"y":49},{"x":54,"y":48},{"x":54,"y":47},{"x":54,"y":46},{"x":53,"y":46},{"x":52,"y":46},{"x":51,"y":46},{"x":50,"y":46},{"x":49,"y":46},{"x":48,"y":46},{"x":47,"y":46},{"x":46,"y":46},{"x":45,"y":46},{"x":44,"y":46},{"x":43,"y":46},{"x":42,"y":46},{"x":41,"y":46},{"x":40,"y":46},{"x":37,"y":46},{"x":36,"y":51},{"x":36,"y":50},{"x":36,"y":49},{"x":36,"y":48},{"x":36,"y":47},{"x":36,"y":46},{"x":39,"y":46},{"x":38,"y":46},{"x":16,"y":51},{"x":17,"y":51},{"x":18,"y":51},{"x":21,"y":51},{"x":22,"y":51},{"x":23,"y":51},{"x":24,"y":51},{"x":25,"y":51},{"x":26,"y":51},{"x":27,"y":51},{"x":28,"y":51},{"x":29,"y":51},{"x":30,"y":51},{"x":31,"y":51},{"x":32,"y":51},{"x":32,"y":50},{"x":32,"y":49},{"x":32,"y":48},{"x":32,"y":47},{"x":31,"y":47},{"x":30,"y":47},{"x":29,"y":47},{"x":28,"y":47},{"x":27,"y":47},{"x":26,"y":47},{"x":25,"y":47},{"x":24,"y":47},{"x":23,"y":47},{"x":22,"y":47},{"x":21,"y":47},{"x":20,"y":47},{"x":19,"y":47},{"x":18,"y":47},{"x":17,"y":47},{"x":16,"y":47},{"x":16,"y":48},{"x":16,"y":49},{"x":16,"y":50},{"x":17,"y":50},{"x":18,"y":50},{"x":19,"y":50},{"x":20,"y":50},{"x":21,"y":50},{"x":22,"y":50},{"x":23,"y":50},{"x":24,"y":50},{"x":25,"y":50},{"x":26,"y":50},{"x":27,"y":50},{"x":28,"y":50},{"x":29,"y":50},{"x":30,"y":50},{"x":31,"y":50},{"x":31,"y":49},{"x":31,"y":48},{"x":30,"y":48},{"x":29,"y":48},{"x":28,"y":48},{"x":27,"y":48},{"x":26,"y":48},{"x":25,"y":48},{"x":24,"y":48},{"x":23,"y":48},{"x":22,"y":48},{"x":21,"y":48},{"x":20,"y":48},{"x":19,"y":48},{"x":18,"y":48},{"x":17,"y":48},{"x":17,"y":49},{"x":18,"y":49},{"x":19,"y":49},{"x":20,"y":49},{"x":21,"y":49},{"x":22,"y":49},{"x":23,"y":49},{"x":24,"y":49},{"x":25,"y":49},{"x":26,"y":49},{"x":27,"y":49},{"x":30,"y":49},{"x":29,"y":49},{"x":28,"y":49},{"x":19,"y":51},{"x":20,"y":51},{"x":37,"y":51},{"x":38,"y":51},{"x":39,"y":51},{"x":40,"y":51},{"x":41,"y":51},{"x":42,"y":51},{"x":45,"y":51},{"x":46,"y":51},{"x":47,"y":51},{"x":48,"y":51},{"x":49,"y":51},{"x":50,"y":51},{"x":51,"y":51},{"x":52,"y":51},{"x":53,"y":51},{"x":53,"y":50},{"x":53,"y":49},{"x":53,"y":48},{"x":53,"y":47},{"x":52,"y":47},{"x":51,"y":47},{"x":50,"y":47},{"x":49,"y":47},{"x":48,"y":47},{"x":47,"y":47},{"x":46,"y":47},{"x":45,"y":47},{"x":44,"y":47},{"x":43,"y":47},{"x":42,"y":47},{"x":41,"y":47},{"x":40,"y":47},{"x":39,"y":47},{"x":38,"y":47},{"x":37,"y":47},{"x":37,"y":48},{"x":38,"y":49},{"x":37,"y":49},{"x":37,"y":50},{"x":38,"y":50},{"x":39,"y":50},{"x":40,"y":50},{"x":41,"y":50},{"x":42,"y":50},{"x":43,"y":50},{"x":44,"y":50},{"x":45,"y":50},{"x":46,"y":50},{"x":47,"y":50},{"x":48,"y":50},{"x":49,"y":50},{"x":50,"y":50},{"x":51,"y":50},{"x":52,"y":50},{"x":52,"y":49},{"x":52,"y":48},{"x":51,"y":48},{"x":50,"y":48},{"x":49,"y":48},{"x":48,"y":48},{"x":47,"y":48},{"x":46,"y":48},{"x":45,"y":48},{"x":44,"y":48},{"x":43,"y":48},{"x":42,"y":48},{"x":41,"y":48},{"x":40,"y":48},{"x":39,"y":48},{"x":38,"y":48},{"x":39,"y":49},{"x":40,"y":49},{"x":41,"y":49},{"x":42,"y":49},{"x":43,"y":49},{"x":44,"y":49},{"x":45,"y":49},{"x":46,"y":49},{"x":47,"y":49},{"x":51,"y":49},{"x":50,"y":49},{"x":49,"y":49},{"x":48,"y":49},{"x":43,"y":51},{"x":44,"y":51},{"x":17,"y":45},{"x":18,"y":45},{"x":19,"y":45},{"x":21,"y":45},{"x":22,"y":45},{"x":23,"y":45},{"x":24,"y":45},{"x":25,"y":45},{"x":26,"y":45},{"x":27,"y":45},{"x":28,"y":45},{"x":29,"y":45},{"x":30,"y":45},{"x":31,"y":45},{"x":32,"y":45},{"x":33,"y":45},{"x":34,"y":45},{"x":35,"y":45},{"x":36,"y":45},{"x":37,"y":45},{"x":38,"y":45},{"x":39,"y":45},{"x":40,"y":45},{"x":41,"y":45},{"x":42,"y":45},{"x":43,"y":45},{"x":44,"y":45},{"x":45,"y":45},{"x":46,"y":45},{"x":47,"y":45},{"x":48,"y":45},{"x":49,"y":45},{"x":50,"y":45},{"x":51,"y":45},{"x":52,"y":45},{"x":20,"y":45},{"x":48,"y":41},{"x":47,"y":41},{"x":46,"y":41},{"x":45,"y":41},{"x":44,"y":41},{"x":43,"y":41},{"x":42,"y":41},{"x":41,"y":41},{"x":40,"y":41},{"x":39,"y":41},{"x":38,"y":41},{"x":37,"y":41},{"x":36,"y":41},{"x":35,"y":41},{"x":34,"y":41},{"x":33,"y":41},{"x":32,"y":41},{"x":31,"y":41},{"x":30,"y":41},{"x":29,"y":41},{"x":28,"y":41},{"x":27,"y":41},{"x":26,"y":41},{"x":25,"y":41},{"x":24,"y":41},{"x":23,"y":41},{"x":22,"y":41},{"x":21,"y":40},{"x":27,"y":40},{"x":28,"y":40},{"x":29,"y":40},{"x":30,"y":40},{"x":31,"y":40},{"x":32,"y":40},{"x":33,"y":40},{"x":34,"y":40},{"x":35,"y":40},{"x":36,"y":40},{"x":37,"y":40},{"x":38,"y":40},{"x":39,"y":40},{"x":40,"y":40},{"x":41,"y":40},{"x":48,"y":40},{"x":49,"y":40},{"x":47,"y":40},{"x":46,"y":40},{"x":45,"y":40},{"x":44,"y":40},{"x":43,"y":40},{"x":42,"y":40},{"x":26,"y":40},{"x":25,"y":40},{"x":24,"y":40},{"x":23,"y":40},{"x":22,"y":40},{"x":20,"y":39},{"x":21,"y":39},{"x":22,"y":39},{"x":23,"y":39},{"x":24,"y":39},{"x":25,"y":39},{"x":26,"y":39},{"x":27,"y":39},{"x":28,"y":39},{"x":29,"y":39},{"x":30,"y":39},{"x":31,"y":39},{"x":32,"y":39},{"x":33,"y":39},{"x":34,"y":39},{"x":35,"y":39},{"x":36,"y":39},{"x":37,"y":39},{"x":38,"y":39},{"x":39,"y":39},{"x":40,"y":39},{"x":41,"y":39},{"x":42,"y":39},{"x":43,"y":39},{"x":44,"y":39},{"x":45,"y":39},{"x":46,"y":39},{"x":47,"y":39},{"x":48,"y":39},{"x":49,"y":39},{"x":50,"y":39},{"x":23,"y":36},{"x":22,"y":36},{"x":21,"y":36},{"x":20,"y":36},{"x":19,"y":36},{"x":51,"y":36},{"x":50,"y":36},{"x":49,"y":36},{"x":48,"y":36},{"x":47,"y":36},{"x":19,"y":35},{"x":19,"y":34},{"x":19,"y":33},{"x":20,"y":33},{"x":21,"y":33},{"x":22,"y":33},{"x":23,"y":33},{"x":23,"y":34},{"x":23,"y":35},{"x":22,"y":35},{"x":21,"y":35},{"x":20,"y":35},{"x":20,"y":34},{"x":21,"y":34},{"x":22,"y":34},{"x":47,"y":35},{"x":47,"y":34},{"x":47,"y":33},{"x":48,"y":33},{"x":49,"y":33},{"x":50,"y":33},{"x":51,"y":33},{"x":51,"y":35},{"x":51,"y":34},{"x":50,"y":34},{"x":49,"y":34},{"x":48,"y":34},{"x":48,"y":35},{"x":49,"y":35},{"x":50,"y":35},{"x":18,"y":32},{"x":17,"y":32},{"x":16,"y":32},{"x":15,"y":32},{"x":15,"y":31},{"x":15,"y":30},{"x":16,"y":30},{"x":17,"y":30},{"x":18,"y":30},{"x":19,"y":30},{"x":20,"y":30},{"x":21,"y":30},{"x":22,"y":30},{"x":23,"y":30},{"x":23,"y":31},{"x":23,"y":32},{"x":22,"y":32},{"x":21,"y":32},{"x":20,"y":32},{"x":19,"y":32},{"x":16,"y":31},{"x":17,"y":31},{"x":18,"y":31},{"x":19,"y":31},{"x":20,"y":31},{"x":21,"y":31},{"x":22,"y":31},{"x":47,"y":32},{"x":53,"y":32},{"x":52,"y":32},{"x":51,"y":32},{"x":50,"y":32},{"x":49,"y":32},{"x":48,"y":32},{"x":54,"y":32},{"x":55,"y":32},{"x":55,"y":31},{"x":54,"y":31},{"x":53,"y":31},{"x":52,"y":31},{"x":51,"y":31},{"x":50,"y":31},{"x":49,"y":31},{"x":48,"y":31},{"x":47,"y":31},{"x":48,"y":30},{"x":49,"y":30},{"x":50,"y":30},{"x":51,"y":30},{"x":52,"y":30},{"x":53,"y":30},{"x":54,"y":30},{"x":55,"y":30},{"x":26,"y":36},{"x":27,"y":36},{"x":28,"y":36},{"x":29,"y":36},{"x":30,"y":36},{"x":31,"y":36},{"x":32,"y":36},{"x":33,"y":36},{"x":34,"y":36},{"x":35,"y":36},{"x":36,"y":36},{"x":37,"y":36},{"x":38,"y":36},{"x":39,"y":36},{"x":40,"y":36},{"x":41,"y":36},{"x":42,"y":36},{"x":43,"y":36},{"x":44,"y":36},{"x":45,"y":36},{"x":26,"y":35},{"x":26,"y":34},{"x":26,"y":33},{"x":26,"y":32},{"x":26,"y":31},{"x":27,"y":31},{"x":28,"y":31},{"x":29,"y":31},{"x":30,"y":31},{"x":31,"y":31},{"x":32,"y":31},{"x":33,"y":31},{"x":34,"y":31},{"x":35,"y":31},{"x":36,"y":31},{"x":37,"y":31},{"x":38,"y":31},{"x":39,"y":31},{"x":40,"y":31},{"x":41,"y":31},{"x":42,"y":31},{"x":43,"y":31},{"x":44,"y":31},{"x":45,"y":31},{"x":45,"y":32},{"x":45,"y":33},{"x":45,"y":34},{"x":45,"y":35},{"x":44,"y":35},{"x":43,"y":35},{"x":42,"y":35},{"x":41,"y":35},{"x":40,"y":35},{"x":39,"y":35},{"x":38,"y":35},{"x":37,"y":35},{"x":36,"y":35},{"x":35,"y":35},{"x":34,"y":35},{"x":33,"y":35},{"x":32,"y":35},{"x":31,"y":35},{"x":30,"y":35},{"x":29,"y":35},{"x":28,"y":35},{"x":27,"y":35},{"x":27,"y":34},{"x":27,"y":33},{"x":28,"y":32},{"x":29,"y":32},{"x":30,"y":32},{"x":31,"y":32},{"x":32,"y":32},{"x":33,"y":32},{"x":34,"y":32},{"x":35,"y":32},{"x":36,"y":32},{"x":37,"y":32},{"x":38,"y":32},{"x":39,"y":32},{"x":40,"y":32},{"x":41,"y":32},{"x":42,"y":32},{"x":43,"y":32},{"x":44,"y":32},{"x":44,"y":33},{"x":44,"y":34},{"x":43,"y":34},{"x":42,"y":34},{"x":41,"y":34},{"x":40,"y":34},{"x":39,"y":34},{"x":38,"y":34},{"x":37,"y":34},{"x":36,"y":34},{"x":35,"y":34},{"x":34,"y":34},{"x":33,"y":34},{"x":32,"y":34},{"x":31,"y":34},{"x":30,"y":34},{"x":29,"y":34},{"x":28,"y":34},{"x":28,"y":33},{"x":29,"y":33},{"x":30,"y":33},{"x":31,"y":33},{"x":32,"y":33},{"x":33,"y":33},{"x":34,"y":33},{"x":35,"y":33},{"x":36,"y":33},{"x":37,"y":33},{"x":38,"y":33},{"x":39,"y":33},{"x":40,"y":33},{"x":41,"y":33},{"x":42,"y":33},{"x":43,"y":33},{"x":27,"y":32},{"x":24,"y":30},{"x":25,"y":30},{"x":26,"y":30},{"x":27,"y":30},{"x":28,"y":30},{"x":29,"y":30},{"x":30,"y":30},{"x":31,"y":30},{"x":32,"y":30},{"x":33,"y":30},{"x":34,"y":30},{"x":35,"y":30},{"x":36,"y":30},{"x":37,"y":30},{"x":38,"y":30},{"x":39,"y":30},{"x":40,"y":30},{"x":41,"y":30},{"x":42,"y":30},{"x":43,"y":30},{"x":44,"y":30},{"x":45,"y":30},{"x":57,"y":39},{"x":58,"y":39},{"x":59,"y":39},{"x":60,"y":39},{"x":61,"y":40},{"x":62,"y":40},{"x":63,"y":40},{"x":64,"y":41},{"x":65,"y":41},{"x":66,"y":41},{"x":67,"y":42},{"x":68,"y":42},{"x":69,"y":43},{"x":68,"y":43},{"x":67,"y":43},{"x":66,"y":43},{"x":65,"y":43},{"x":58,"y":40},{"x":59,"y":40},{"x":60,"y":40},{"x":59,"y":41},{"x":60,"y":41},{"x":61,"y":41},{"x":62,"y":41},{"x":63,"y":41},{"x":60,"y":42},{"x":61,"y":42},{"x":62,"y":42},{"x":63,"y":42},{"x":64,"y":42},{"x":65,"y":42},{"x":66,"y":42},{"x":61,"y":43},{"x":62,"y":43},{"x":63,"y":43},{"x":64,"y":43},{"x":13,"y":39},{"x":12,"y":39},{"x":9,"y":40},{"x":6,"y":41},{"x":3,"y":43},{"x":10,"y":40},{"x":11,"y":40},{"x":12,"y":40},{"x":7,"y":41},{"x":8,"y":41},{"x":9,"y":41},{"x":10,"y":41},{"x":11,"y":41},{"x":9,"y":43},{"x":8,"y":43},{"x":7,"y":43},{"x":6,"y":43},{"x":5,"y":43},{"x":4,"y":43},{"x":4,"y":42},{"x":5,"y":42},{"x":6,"y":42},{"x":7,"y":42},{"x":8,"y":42},{"x":9,"y":42},{"x":10,"y":42},{"x":10,"y":43},{"x":11,"y":43},{"x":11,"y":42},{"x":12,"y":42},{"x":12,"y":41},{"x":13,"y":41},{"x":13,"y":40},{"x":14,"y":40},{"x":14,"y":39},{"x":15,"y":39}],"labels":[{"id":"label-5d2ba804-fb28-455f-8723-cdc6f6fb0ba7","text":"балкон","x":33,"y":28,"kind":"section"},{"id":"label-08d2b22d-0658-428c-99a2-f52077e2b9fe","text":"партер","x":33,"y":43,"kind":"section"},{"id":"label-7e09d8a8-9bad-48e2-a986-a0aa45f560fe","text":"ложа 1","x":10,"y":37,"kind":"section"},{"id":"label-20da29d9-815e-4da3-b938-a77ff5bf8454","text":"ложа 2","x":57,"y":37,"kind":"section"},{"id":"label-07750f2e-28f7-44ba-ac3a-83a819f3289e","text":"ряд 1","x":11,"y":67,"kind":"row"},{"id":"label-adcc8833-7b37-4029-9ad0-950f635c9902","text":"ряд 2","x":11,"y":66,"kind":"row"},{"id":"label-74ad50b1-3cd7-458c-816f-ebe0699c32ae","text":"ряд 3","x":11,"y":65,"kind":"row"},{"id":"label-edf3355c-8f1c-463d-9418-97e0e37838d7","text":"ряд 4","x":11,"y":64,"kind":"row"},{"id":"label-474eff5f-eb78-4795-aa64-18330abe6b41","text":"ряд 5","x":11,"y":63,"kind":"row"},{"id":"label-f8145349-18b5-4b1e-8da1-5cccad5fa977","text":"ряд 6","x":11,"y":62,"kind":"row"},{"id":"label-25affcdb-8408-4354-9ee4-f09411b023b4","text":"ряд 7","x":11,"y":61,"kind":"row"},{"id":"label-43b53941-7f61-4ece-8525-4dc7631a3043","text":"ряд 8","x":11,"y":60,"kind":"row"},{"id":"label-c02e386f-c817-4b97-adb9-d8c19e72ba8f","text":"ряд 9","x":11,"y":59,"kind":"row"},{"id":"label-72ee5a55-051d-4f2f-ba4d-4bad01d3ac38","text":"ряд 10","x":11,"y":58,"kind":"row"},{"id":"label-7c28a106-b5eb-4cf6-bb60-1fe85d789c6f","text":"ряд 11","x":11,"y":57,"kind":"row"},{"id":"label-ed0a8c4a-02c3-45b2-a48f-a43263182df1","text":"ряд 12","x":11,"y":56,"kind":"row"},{"id":"label-210b7c61-8914-47a6-a659-db8b8095acb7","text":"ряд 13","x":11,"y":55,"kind":"row"},{"id":"label-6d49b89b-60cd-46dd-8f47-a911596eab4e","text":"ряд 14","x":11,"y":52,"kind":"row"},{"id":"label-93de559b-f0c0-4824-8f79-67e6b682a7a8","text":"ряд 15","x":11,"y":51,"kind":"row"},{"id":"label-5dce6165-dd5d-4eac-9a81-72b72008ed45","text":"ряд 16","x":11,"y":50,"kind":"row"},{"id":"label-e39a5941-0427-4be3-80f3-05fd6600eade","text":"ряд 17","x":11,"y":49,"kind":"row"},{"id":"label-defcbd81-b2fb-42c2-a561-6c3d9d4bd41c","text":"ряд 18","x":11,"y":48,"kind":"row"},{"id":"label-1594b039-2016-4c7d-858e-995acf297648","text":"ряд 19","x":11,"y":47,"kind":"row"},{"id":"label-481f9d51-53bc-47b9-9d7b-14d2ced32dea","text":"ряд 20","x":11,"y":46,"kind":"row"},{"id":"label-fcd8c23b-386a-45b9-8eef-79c92a6aa196","text":"ряд 21","x":11,"y":45,"kind":"row"},{"id":"label-aa2525a1-37a6-49f0-bc48-cc9bc69e3cdc","text":"ряд 1","x":16,"y":41,"kind":"row"},{"id":"label-9658729b-f9f3-48ef-9876-d0a5ccca6334","text":"ряд 2","x":16,"y":40,"kind":"row"},{"id":"label-d8a13267-77db-4fed-9079-7caeb0a6bec7","text":"ряд 3","x":16,"y":39,"kind":"row"},{"id":"label-98ed6f6c-60aa-400a-a4a7-1c863a1c1e93","text":"ряд 4","x":15,"y":36,"kind":"row"},{"id":"label-0028e51e-2abf-43c4-929a-6b428f6cc32f","text":"ряд 5","x":15,"y":35,"kind":"row"},{"id":"label-87b7b4ea-a375-432f-ab28-5ac34f35b0b9","text":"ряд 6","x":15,"y":34,"kind":"row"},{"id":"label-f0dcd98d-e2ba-456e-8fca-925bd76fb527","text":"ряд 7","x":15,"y":33,"kind":"row"},{"id":"label-d8f68325-eb29-49a7-886c-37a06ab4dbc5","text":"ряд 8","x":11,"y":32,"kind":"row"},{"id":"label-04c24ed0-7863-4247-a030-d3cef3b2d404","text":"ряд 9","x":11,"y":31,"kind":"row"},{"id":"label-c0e16bd7-fed9-40f2-9efa-bff39c13bd4a","text":"ряд 10","x":11,"y":30,"kind":"row"},{"id":"label-bbe554ef-f241-45a7-b533-29f5f0122d11","text":"ряд 1","x":0,"y":43,"kind":"row"},{"id":"label-db03189a-ca94-4302-a0e3-22c8b261fec6","text":"ряд 2","x":0,"y":42,"kind":"row"},{"id":"label-61b7929e-c88c-49a0-a157-c4b15b1f295c","text":"ряд 3","x":0,"y":41,"kind":"row"},{"id":"label-3426a64e-1b0d-4933-837c-2984d8027df3","text":"ряд 4","x":0,"y":40,"kind":"row"},{"id":"label-a0560c9f-f66a-45d9-b8e1-fc1ed9b1fd20","text":"ряд 5","x":0,"y":39,"kind":"row"}]}`;

export const hallSections = [
  {
    id: "lodge-left",
    title: " 1",
    titleAlign: "left",
    labelMode: "left",
    align: "start",
    rows: [
      { rowLabel: "5", offset: 6, blocks: [5] },
      { rowLabel: "4", offset: 4, blocks: [7] },
      { rowLabel: "3", offset: 2, blocks: [9] },
      { rowLabel: "2", offset: 1, blocks: [11] },
      { rowLabel: "1", offset: 0, blocks: [12] }
    ]
  },
  {
    id: "balcony",
    title: "",
    titleAlign: "center",
    labelMode: "both",
    align: "center",
    rows: [
      { rowLabel: "10", blocks: [8, 18, 8] },
      { rowLabel: "9", blocks: [8, 18, 8] },
      { rowLabel: "8", blocks: [8, 18, 8] },
      { rowLabel: "7", blocks: [4, 18, 4] },
      { rowLabel: "6", blocks: [4, 18, 4] },
      { rowLabel: "5", blocks: [4, 18, 4] },
      { rowLabel: "4", blocks: [4, 18, 4] },
      { rowLabel: "3", blocks: [22] },
      { rowLabel: "2", blocks: [20] },
      { rowLabel: "1", blocks: [18] }
    ]
  },
  {
    id: "lodge-right",
    title: " 2",
    titleAlign: "right",
    labelMode: "right",
    align: "end",
    rows: [
      { rowLabel: "5", offset: 0, blocks: [5] },
      { rowLabel: "4", offset: 1, blocks: [7] },
      { rowLabel: "3", offset: 2, blocks: [9] },
      { rowLabel: "2", offset: 4, blocks: [11] },
      { rowLabel: "1", offset: 6, blocks: [12] }
    ]
  },
  {
    id: "parter",
    title: "",
    titleAlign: "center",
    labelMode: "both",
    align: "center",
    rows: [
      { rowLabel: "21", blocks: [16, 16] },
      { rowLabel: "20", blocks: [16, 16] },
      { rowLabel: "19", blocks: [16, 16] },
      { rowLabel: "18", blocks: [16, 16] },
      { rowLabel: "17", blocks: [16, 16] },
      { rowLabel: "16", blocks: [16, 16] },
      { rowLabel: "15", blocks: [16, 16] },
      { rowLabel: "14", blocks: [16, 16] },
      { rowLabel: "13", blocks: [16, 16], spacerBefore: true },
      { rowLabel: "12", blocks: [16, 16] },
      { rowLabel: "11", blocks: [16, 16] },
      { rowLabel: "10", blocks: [16, 16] },
      { rowLabel: "9", blocks: [16, 16] },
      { rowLabel: "8", blocks: [16, 16] },
      { rowLabel: "7", blocks: [16, 16] },
      { rowLabel: "6", blocks: [16, 16] },
      { rowLabel: "5", blocks: [16, 16] },
      { rowLabel: "4", blocks: [15, 15] },
      { rowLabel: "3", blocks: [14, 14] },
      { rowLabel: "2", blocks: [13, 13] },
      { rowLabel: "1", blocks: [12, 12] }
    ]
  }
];

function buildPresetSeats() {
  return hallSections.flatMap((section) =>
    section.rows.flatMap((rowConfig) =>
      rowConfig.blocks.flatMap((seatCount, blockIndex) =>
        Array.from({ length: seatCount }, (_, index) => ({
          id: `${section.id}-${rowConfig.rowLabel}-${blockIndex + 1}-${index + 1}`,
          row: rowConfig.rowLabel,
          number: index + 1,
          sectionId: section.id,
          sectionTitle: section.title,
          block: blockIndex + 1,
          ticketLabel: `${rowConfig.rowLabel}-${index + 1}`,
          label: `${section.title},  ${rowConfig.rowLabel},  ${index + 1}`
        }))
      )
    )
  );
}

function getCustomSectionMeta(cell) {
  if (cell.y <= 32) {
    return { id: "balcony", title: "", code: "B" };
  }

  if (cell.y <= 43 && cell.x <= 23) {
    return { id: "lodge-left", title: " 1", code: "L1" };
  }

  if (cell.y <= 43 && cell.x >= 47) {
    return { id: "lodge-right", title: " 2", code: "L2" };
  }

  return { id: "parter", title: "", code: "P" };
}

function normalizeCustomLayout(layout) {
  if (!layout || !Array.isArray(layout.cells)) {
    return null;
  }

  const rows = Number(layout.rows || CUSTOM_LAYOUT_SIZE);
  const cols = Number(layout.cols || CUSTOM_LAYOUT_SIZE);
  const seen = new Set();
  const cells = layout.cells
    .map((cell) => ({
      x: Number(cell.x),
      y: Number(cell.y)
    }))
    .filter((cell) => Number.isInteger(cell.x) && Number.isInteger(cell.y))
    .filter((cell) => cell.x >= 0 && cell.x < cols && cell.y >= 0 && cell.y < rows)
    .filter((cell) => {
      const key = `${cell.x}:${cell.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const labels = Array.isArray(layout.labels)
    ? layout.labels
        .map((label) => ({
          id: String(label.id || ""),
          text: String(label.text || "").trim(),
          x: Number(label.x),
          y: Number(label.y),
          kind: String(label.kind || "custom")
        }))
        .filter((label) => label.text)
        .filter((label) => Number.isInteger(label.x) && Number.isInteger(label.y))
        .filter((label) => label.x >= 0 && label.x < cols && label.y >= 0 && label.y < rows)
    : [];

  return {
    rows,
    cols,
    cells,
    labels
  };
}

export const EMBEDDED_CUSTOM_LAYOUT = normalizeCustomLayout(JSON.parse(EMBEDDED_CUSTOM_LAYOUT_RAW));

function buildSeatsFromCustomLayout(layout) {
  const normalized = normalizeCustomLayout(layout);
  if (!normalized) {
    return [];
  }

  const rowValues = [...new Set(normalized.cells.map((cell) => cell.y))].sort((a, b) => b - a);
  const rowNumberByY = new Map(rowValues.map((y, index) => [y, String(index + 1)]));

  return rowValues.flatMap((y) => {
    const cellsInRow = normalized.cells
      .filter((cell) => cell.y === y)
      .sort((a, b) => a.x - b.x);

    const rowLabel = rowNumberByY.get(y);
    return cellsInRow.map((cell, index) => ({
      id: `custom-${y}-${cell.x}`,
      row: rowLabel,
      number: index + 1,
      sectionId: "custom",
      sectionTitle: " ",
      block: 1,
      gridX: cell.x,
      gridY: cell.y,
      ticketLabel: `${rowLabel}-${index + 1}`,
      label: ` ${rowLabel},  ${index + 1}`
    }));
  });
}

function buildSectionedSeatsFromCustomLayout(layout) {
  const normalized = normalizeCustomLayout(layout);
  if (!normalized) {
    return [];
  }

  const cellsBySection = new Map();

  normalized.cells.forEach((cell) => {
    const section = getCustomSectionMeta(cell);
    if (!cellsBySection.has(section.id)) {
      cellsBySection.set(section.id, { section, cells: [] });
    }
    cellsBySection.get(section.id).cells.push(cell);
  });

  return [...cellsBySection.values()].flatMap(({ section, cells }) => {
    const rowValues = [...new Set(cells.map((cell) => cell.y))].sort((a, b) => b - a);
    const rowNumberByY = new Map(rowValues.map((y, index) => [y, String(index + 1)]));

    return rowValues.flatMap((y) => {
      const cellsInRow = cells
        .filter((cell) => cell.y === y)
        .sort((a, b) => a.x - b.x);

      const rowLabel = rowNumberByY.get(y);
      return cellsInRow.map((cell, index) => ({
        id: `custom-${y}-${cell.x}`,
        row: rowLabel,
        number: index + 1,
        sectionId: section.id,
        sectionTitle: section.title,
        block: 1,
        gridX: cell.x,
        gridY: cell.y,
        ticketLabel: `${section.code}${rowLabel}-${index + 1}`,
        label: `${section.title},  ${rowLabel},  ${index + 1}`
      }));
    });
  });
}

function mapCustomAbsoluteSeat(absoluteRow, absoluteSeatNumber) {
  if (absoluteRow >= 1 && absoluteRow <= 21) {
    return {
      sectionId: "parter",
      sectionTitle: "",
      sectionCode: "P",
      row: String(absoluteRow),
      number: absoluteSeatNumber
    };
  }

  const balconyRanges = {
    24: [9, 35],
    25: [7, 35],
    26: [5, 35],
    27: [1, 30],
    28: [1, 30],
    29: [1, 30],
    30: [1, 30],
    31: [1, 38],
    32: [1, 38],
    33: [1, 39]
  };

  const lodgeLeftRanges = {
    22: [1, 9],
    23: [1, 9],
    24: [1, 8],
    25: [1, 6],
    26: [1, 4]
  };

  const lodgeRightRanges = {
    22: [10, 18],
    23: [10, 18],
    24: [36, 43],
    25: [36, 41],
    26: [36, 39]
  };

  if (lodgeLeftRanges[absoluteRow]) {
    const [start, end] = lodgeLeftRanges[absoluteRow];
    if (absoluteSeatNumber >= start && absoluteSeatNumber <= end) {
      return {
        sectionId: "lodge-left",
        sectionTitle: " 1",
        sectionCode: "L1",
        row: String(absoluteRow - 21),
        number: absoluteSeatNumber - start + 1
      };
    }
  }

  if (lodgeRightRanges[absoluteRow]) {
    const [start, end] = lodgeRightRanges[absoluteRow];
    if (absoluteSeatNumber >= start && absoluteSeatNumber <= end) {
      return {
        sectionId: "lodge-right",
        sectionTitle: " 2",
        sectionCode: "L2",
        row: String(absoluteRow - 21),
        number: absoluteSeatNumber - start + 1
      };
    }
  }

  if (balconyRanges[absoluteRow]) {
    const [start, end] = balconyRanges[absoluteRow];
    if (absoluteSeatNumber >= start && absoluteSeatNumber <= end) {
      return {
        sectionId: "balcony",
        sectionTitle: "",
        sectionCode: "B",
        row: String(absoluteRow - 23),
        number: absoluteSeatNumber - start + 1
      };
    }
  }

  return {
    sectionId: "custom",
    sectionTitle: " ",
    sectionCode: "C",
    row: String(absoluteRow),
    number: absoluteSeatNumber
  };
}

function buildMappedSeatsFromCustomLayout(layout) {
  const normalized = normalizeCustomLayout(layout);
  if (!normalized) {
    return [];
  }

  const rowValues = [...new Set(normalized.cells.map((cell) => cell.y))].sort((a, b) => b - a);
  const absoluteRowByY = new Map(rowValues.map((y, index) => [y, index + 1]));

  return rowValues.flatMap((y) => {
    const cellsInRow = normalized.cells
      .filter((cell) => cell.y === y)
      .sort((a, b) => a.x - b.x);

    const absoluteRow = absoluteRowByY.get(y);
    return cellsInRow.map((cell, index) => {
      const absoluteSeatNumber = index + 1;
      const mapped = mapCustomAbsoluteSeat(absoluteRow, absoluteSeatNumber);

      return {
        id: `custom-${y}-${cell.x}`,
        row: mapped.row,
        number: mapped.number,
        sectionId: mapped.sectionId,
        sectionTitle: mapped.sectionTitle,
        block: 1,
        gridX: cell.x,
        gridY: cell.y,
        ticketLabel: `${mapped.sectionCode}${mapped.row}-${mapped.number}`,
        label: `${mapped.sectionTitle},  ${mapped.row},  ${mapped.number}`
      };
    });
  });
}

function buildSeats(customLayout = null) {
  const normalized = normalizeCustomLayout(customLayout) || EMBEDDED_CUSTOM_LAYOUT;
  return normalized ? buildMappedSeatsFromCustomLayout(normalized) : buildPresetSeats();
}

const defaultState = {
  version: 4,
  event: {
    title: "   ",
    slug: "miss-mister-vvgu-2026",
    dateLabel: "  2026"
  },
  customLayout: EMBEDDED_CUSTOM_LAYOUT,
  seats: buildSeats(EMBEDDED_CUSTOM_LAYOUT),
  holds: [],
  bookings: [],
  lastUpdatedAt: null
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cleanupExpiredHolds(clone(defaultState));
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== defaultState.version) {
      return cleanupExpiredHolds(clone(defaultState));
    }

    const customLayout = normalizeCustomLayout(parsed.customLayout) || EMBEDDED_CUSTOM_LAYOUT;
    return cleanupExpiredHolds({
      ...clone(defaultState),
      ...parsed,
      customLayout,
      seats: buildSeats(customLayout),
      holds: Array.isArray(parsed.holds) ? parsed.holds : [],
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
    });
  } catch (error) {
    console.warn("   localStorage,    .", error);
    return clone(defaultState);
  }
}

export function saveState(state) {
  const customLayout = normalizeCustomLayout(state.customLayout) || EMBEDDED_CUSTOM_LAYOUT;
  const next = {
    ...state,
    customLayout,
    seats: buildSeats(customLayout),
    lastUpdatedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = `VVGU-DEVICE-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  return deviceId;
}

export function getDeviceQrPayload(deviceId, role = "viewer") {
  return JSON.stringify({
    type: "device",
    role,
    deviceId
  });
}

export function cleanupExpiredHolds(state) {
  const now = Date.now();
  return {
    ...state,
    holds: (state.holds || []).filter((hold) => hold.expiresAt > now)
  };
}

export function applyCustomLayout(state, layout) {
  const customLayout = normalizeCustomLayout(layout);
  const nextState = clone(state);
  nextState.customLayout = customLayout;
  nextState.seats = buildSeats(customLayout);
  nextState.holds = [];
  nextState.bookings = [];
  return saveState(nextState);
}

export function hydrateCustomLayout(state, layout) {
  const customLayout = normalizeCustomLayout(layout);
  const nextState = clone(state);
  nextState.customLayout = customLayout;
  nextState.seats = buildSeats(customLayout);
  return saveState(nextState);
}

export function getSeatStatusMap(bookings, holds = [], currentOwnerId = null) {
  const acc = {};

  bookings.reduce((map, booking) => {
    booking.tickets.forEach((ticket) => {
      map[ticket.seatId] = ticket.status;
    });
    return map;
  }, acc);

  holds.forEach((hold) => {
    if (!acc[hold.seatId]) {
      acc[hold.seatId] = hold.ownerId === currentOwnerId ? "selected" : "held";
    }
  });

  return acc;
}

export function isSeatAvailable(state, seatId, currentOwnerId = null) {
  const seatStatusMap = getSeatStatusMap(state.bookings, state.holds, currentOwnerId);
  return !seatStatusMap[seatId] || seatStatusMap[seatId] === "selected";
}

export function holdSeat(state, seatId, ownerId) {
  const nextState = cleanupExpiredHolds(clone(state));
  if (!isSeatAvailable(nextState, seatId, ownerId)) {
    return { state: nextState, success: false };
  }

  nextState.holds = nextState.holds.filter((hold) => hold.seatId !== seatId);
  nextState.holds.push({
    seatId,
    ownerId,
    expiresAt: Date.now() + HOLD_TTL_MS
  });

  return { state: saveState(nextState), success: true };
}

export function releaseSeatHold(state, seatId, ownerId) {
  const nextState = cleanupExpiredHolds(clone(state));
  nextState.holds = nextState.holds.filter((hold) => !(hold.seatId === seatId && hold.ownerId === ownerId));
  return saveState(nextState);
}

export function refreshSeatHolds(state, seatIds, ownerId) {
  const nextState = cleanupExpiredHolds(clone(state));
  const targetIds = new Set(seatIds);

  nextState.holds = nextState.holds
    .filter((hold) => !(hold.ownerId === ownerId && targetIds.has(hold.seatId)))
    .concat(
      seatIds.map((seatId) => ({
        seatId,
        ownerId,
        expiresAt: Date.now() + HOLD_TTL_MS
      }))
    );

  return saveState(nextState);
}

export function generateTicketCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VVGU-2026-${random}`;
}

export function createBooking(state, payload) {
  const bookingId = `booking-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const nextState = cleanupExpiredHolds(clone(state));

  const tickets = payload.attendees.map((attendee) => ({
    id: `ticket-${crypto.randomUUID()}`,
    code: generateTicketCode(),
    seatId: attendee.seatId,
    seatLabel: attendee.seatLabel,
    seatDisplayLabel: attendee.seatDisplayLabel,
    fullName: attendee.fullName.trim(),
    group: attendee.group.trim(),
    issuedDeviceId: payload.deviceId,
    status: "booked",
    checkedInAt: null,
    bookingId
  }));

  const booking = {
    id: bookingId,
    createdAt,
    contactPhone: payload.contactPhone.trim(),
    contactNote: payload.contactNote.trim(),
    tickets
  };

  nextState.holds = nextState.holds.filter(
    (hold) => !(hold.ownerId === payload.ownerId && payload.attendees.some((attendee) => attendee.seatId === hold.seatId))
  );
  nextState.bookings.unshift(booking);
  return { state: saveState(nextState), booking };
}

export function updateTicketStatus(state, ticketCode, status) {
  let updatedTicket = null;
  const nextState = clone(state);

  nextState.bookings = nextState.bookings.map((booking) => ({
    ...booking,
    tickets: booking.tickets.map((ticket) => {
      if (ticket.code !== ticketCode) {
        return ticket;
      }

      updatedTicket = {
        ...ticket,
        status,
        checkedInAt: status === "checked" ? new Date().toISOString() : null
      };
      return updatedTicket;
    })
  }));

  if (!updatedTicket) {
    return { state, ticket: null };
  }

  return { state: saveState(nextState), ticket: updatedTicket };
}

export function findTicketByCode(state, code) {
  for (const booking of state.bookings) {
    for (const ticket of booking.tickets) {
      if (ticket.code === code) {
        return { booking, ticket };
      }
    }
  }
  return null;
}

export function flattenTickets(state) {
  return state.bookings.flatMap((booking) =>
    booking.tickets.map((ticket) => ({
      ...ticket,
      contactPhone: booking.contactPhone,
      contactNote: booking.contactNote,
      createdAt: booking.createdAt
    }))
  );
}

export function getTicketsByDevice(state, deviceId) {
  return flattenTickets(state).filter((ticket) => ticket.issuedDeviceId === deviceId);
}

export function getStats(state) {
  const seatsTotal = state.seats.length;
  const tickets = flattenTickets(state);
  const activeHolds = cleanupExpiredHolds(state).holds.length;
  const booked = tickets.filter((ticket) => ticket.status === "booked").length;
  const checked = tickets.filter((ticket) => ticket.status === "checked").length;

  return {
    seatsTotal,
    activeHolds,
    free: seatsTotal - tickets.length - activeHolds,
    booked,
    checked,
    reservedPercent: seatsTotal ? Math.round((tickets.length / seatsTotal) * 100) : 0
  };
}
