const roles = [
  "สมาชิกสภาผู้แทนราษฎร - บัญชีรายชื่อ",
  "สมาชิกสภาผู้แทนราษฎร - แบ่งเขต - ขอนแก่น - #11",
  "สมาชิกสภาผู้แทนราษฎร - แบ่งเขต - นครราชสีมา - #14",
  "สมาชิกสภาผู้แทนราษฎร - แบ่งเขต - สุรินทร์ - #4"
];
for (const r of roles) {
  const parts = r.split(' - ');
  if (parts[1] === 'แบ่งเขต' && parts.length >= 3) {
    console.log(parts[2]);
  } else {
    console.log("No province (Party List)");
  }
}
