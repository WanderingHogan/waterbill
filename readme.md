## to load the shp into postgres 
```ogr2ogr -f "PostgreSQL" "PG:host=127.0.0.1 user=chogan dbname=waterbill password=" "parcel_4326.shp" -lco GEOMETRY_NAME=the_geom -lco FID=gid -lco PRECISION=no -nlt PROMOTE_TO_MULTI -nln parcels -overwrite```

## SQL statement to add empty columns we will write to later
```
ALTER TABLE parcels 
 ADD COLUMN accountNumber numeric,
 ADD COLUMN serviceAddress VARCHAR,
 ADD COLUMN currentReadDate DATE,
 ADD COLUMN currentBillDate DATE,
 ADD COLUMN penaltyDate DATE,
 ADD COLUMN currentBillAmount numeric,
 ADD COLUMN previousBalance numeric,
 ADD COLUMN currentBalance numeric,
 ADD COLUMN previousReadDate DATE,
 ADD COLUMN lastPayDate DATE,
 ADD COLUMN lastPayAmount numeric,
 ADD COLUMN lastUpdate DATE;
```