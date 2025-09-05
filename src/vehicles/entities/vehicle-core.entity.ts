import { Cities } from "../../common/enums";
import { Conditions, Insurances, Status, VehicleBrands, VehiclesTypes } from "../enums";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { VehiclesField } from "./vehicles-field.entity";
import { VehiclesMicrotrack } from "./vehicle-microtrack.entity";
import { VehiclesSales } from "./vehicle-sale.entity";

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 15, unique: true, nullable: true })
    patente: string | null;

    @Column({ type: 'enum', enum: Conditions, default: Conditions.ACTIVO })
    condicion: Conditions;

    @Column({ type: 'enum', enum: Status, nullable: true })
    estado: Status | null;

    @Column({ type: 'enum', enum: VehiclesTypes, nullable: true })
    tipo: VehiclesTypes | null;

    @Column({ type: 'enum', enum: VehicleBrands, nullable: true })
    marca: VehicleBrands | null;

    @Column({ type: 'varchar', length: 20, nullable: true })
    modelo: string | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    asientos: string | null;

    @Column({ type: 'varchar', length: 8, nullable: true })
    carga: string | null;

    @Column({ type: 'int', nullable: true })
    anio: number | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    titular: string | null;

    @Column({ type: 'enum', enum: Cities, nullable: true })
    patenteDe: Cities | null;

    @Column({ type: 'date', nullable: true })
    vtoPatente: Date | null;

    @Column({ type: 'enum', enum: Insurances, nullable: true })
    aseguradora: Insurances | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    nroPoliza: string | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    refPoliza: string | null;

    @Column({ type: 'date', nullable: true })
    vtoSeguro: Date | null;

    @Column({ type: 'date', nullable: true })
    vtoInspeccionGrua: Date | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    seguroTecnico: string | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    rc: string | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    nroChasis: string | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    nroMotor: string | null;

    @Column({ type: 'date', nullable: true })
    fechaInscripcion: Date | null;

    @Column({ type: 'enum', enum: Cities, nullable: true })
    lugarInscripcion: Cities | null;

    @Column({ type: 'int', nullable: true })
    antiguedad: number | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    nroFacturaCompra: string | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    concesionaria: string | null;

    @Column({ type: 'date', nullable: true })
    fechaIngreso: Date | null;

    @Column({ type: 'date', nullable: true })
    fechaDevTitular: Date | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    telUnidadAlquilada: string | null;

    @Column({ type: 'varchar', length: 25, nullable: true })
    mailUnidadAlquilada: string | null;

    //relaciones
    @OneToOne(
        () => VehiclesField,
        (vehiclesField) => vehiclesField.vehicle,
        { cascade: true, nullable: true }
    )
    @JoinColumn()
    vehiclesField: VehiclesField;

    @OneToOne(
        () => VehiclesMicrotrack,
        (vehiclesMicrotrack) => vehiclesMicrotrack.vehicle,
        { cascade: true, nullable: true }
    )
    @JoinColumn()
    vehiclesMicrotrack: VehiclesMicrotrack;

    @OneToOne(
        () => VehiclesSales,
        (VehiclesSales) => VehiclesSales.vehicle,
        { cascade: true, nullable: true }
    )
    @JoinColumn()
    vehiclesSale: VehiclesSales;
}