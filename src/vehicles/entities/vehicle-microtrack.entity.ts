import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Vehicle } from "./vehicle-core.entity";

@Entity('vehicles_microtrack')
export class VehiclesMicrotrack {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date', nullable: true })
    fechaAltaRuta: Date | null;

    @Column({ type: 'date', nullable: true })
    fechaBajaRuta: Date | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    numRuta: string | null;

    @Column({ type: 'boolean', nullable: true })
    microtrack: boolean | null;

    @Column({ type: 'boolean', nullable: true })
    YERestado: boolean | null;

    @Column({ type: 'boolean', default: false })
    YERtarjeta: boolean;

    @OneToOne(
        () => Vehicle,
        (vehicle) => vehicle.vehiclesMicrotrack
    )
    vehicle: Vehicle;
}