import { Contracts, Operators, Zones } from "../../common/enums";
import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { VehicularFunctions } from "../enums";
import { Vehicle } from "./vehicle-core.entity";

@Entity('vehicles_field')
export class VehiclesField {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: Operators, nullable: true })
    operadora: Operators | null;

    @Column({ type: 'enum', enum: Zones, nullable: true })
    area: Zones | null;

    @Column({ type: 'enum', enum: Contracts, nullable: true })
    contrato: Contracts | null;

    @Column({ type: 'enum', enum: VehicularFunctions, nullable: true })
    funcion: VehicularFunctions | null;

    @Column({ type: 'varchar', length: 15, nullable: true })
    nroHabVTV: string | null;

    @Column({ type: 'date', nullable: true })
    fechaInicioVTV: Date | null;

    @Column({ type: 'date', nullable: true })
    vtoVTV: Date | null;

    @Column({ type: 'varchar', length: 30, nullable: true })
    equipoRadio: string | null;

    @Column({ type: 'date', nullable: true })
    vtoCertificacion: Date | null;

    @Column({ type: 'enum', enum: Operators, nullable: true })
    propietarioRadio: Operators | null;

    @Column({ type: 'varchar', length: 30, nullable: true })
    nroSerieRadio: string | null;

    @Column({ type: 'varchar', length: 30, array: true, nullable: true })
    correosAviso: string[] | null;

    @Column({ type: 'varchar', length: 30, nullable: true })
    chofer: string | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    nroCelularChofer: string | null;

    //relaciones
    @OneToOne(
        () => Vehicle,
        (vehicle) => vehicle.vehiclesField
    )
    vehicle: Vehicle;
}