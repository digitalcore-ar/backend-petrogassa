import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Cities } from "src/common/enums";
import { Vehicle } from "./vehicle-core.entity";

@Entity('vehicles_sales')
export class VehiclesSales {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    nombreComprador: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    apellidoComprador: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    cuilCUITcomprador: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    direccionComprador: string | null;

    @Column({ type: 'enum', enum: Cities, nullable: true })
    ciudad: Cities | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    provincia: string | null;

    @Column({ type: 'date', nullable: true })
    fechaVenta: Date | null;

    @Column({ type: 'date', nullable: true })
    fechaEntrega: Date | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telefonoComprador: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    emailComprador: string | null;

    @Column({ type: 'date', nullable: true })
    fechaDenunciaVenta: Date | null;

    @Column({ type: 'date', nullable: true })
    transferenciaFecha: Date | null;

    @Column({ type: 'date', nullable: true })
    fechaBajaSeguro: Date| null;

    @Column({ type: 'date', nullable: true })
    fechaBajaPatente: Date | null;

    @OneToOne(
        () => Vehicle,
        (vehicle) => vehicle.vehiclesSale
    )
    vehicle: Vehicle;
}