import sqlite3

conn = sqlite3.connect('prisma/dev.db')
c = conn.cursor()
c.execute("UPDATE Product SET imageUrl = '/product-images/dairy-bakery/amul-butter.webp' WHERE name LIKE '%Butter%'")
conn.commit()
print("Updated Butter rows:", c.rowcount)
conn.close()
