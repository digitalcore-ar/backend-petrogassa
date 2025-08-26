import { Cities, Contracts, Operators, Zones } from "src/common/enums";
import { Conditions, Insurances, VehicleBrands, VehiclesTypes, VehicularFunctions } from "../enums";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Vehicle {
    //admin
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    patente: string;

    @Column({ type: 'enum', enum: Conditions, default: Conditions.ACTIVO })
    condicion: Conditions;

    @Column({ type: 'varchar', nullable: true })
    observacion: string;

    @Column({ type: 'enum', enum: VehiclesTypes })
    tipo: VehiclesTypes;

    @Column({ type: 'enum', enum: VehicleBrands, nullable: true })
    marca: VehicleBrands;

    @Column({ type: 'varchar', nullable: true })
    modelo: string;

    @Column({ type: 'varchar', nullable: true })
    asientos: string;

    @Column({ type: 'varchar', nullable: true })
    carga: string;

    @Column({ type: 'numeric', nullable: true })
    anio: number;

    @Column({ type: 'varchar', length: 35 })
    titular: string;

    @Column({ type: 'varchar', length: 35, nullable: true })
    leasing: string;

    @Column({ type: 'enum', enum: Cities, nullable: true })
    patentado_en: Cities;

    @Column({ type: 'date', nullable: true })
    vto_patente: Date;

    @Column({ type: 'enum', enum: Insurances, nullable: true })
    aseguradora: Insurances;

    @Column({ type: 'varchar', length: 40, nullable: true })
    nro_poliza: string;

    @Column({ type: 'varchar', length: 40, nullable: true })
    ref_poliza: string;

    @Column({ type: 'date', nullable: true })
    vto_poliza: Date;

    @Column({ type: 'date', nullable: true })
    vto_inspec_grua: Date;

    @Column({ type: 'varchar', length: 40, nullable: true })
    seguro_tecnico: string;

    @Column({ type: 'varchar', length: 40, nullable: true })
    rc: string;

    @Column({ type: 'varchar', length: 40, nullable: true })
    nro_chasis: string;

    @Column({ type: 'varchar', length: 40, nullable: true })
    nro_motor: string;

    @Column({ type: 'date', nullable: true })
    fecha_inscripcion: Date;

    @Column({ type: 'enum', enum: Cities })
    lugar_inscripcion: Cities;

    @Column({ type: 'date' })
    fecha_ingreso: Date;

    @Column({ type: 'varchar', length: 25, nullable: true })
    tel_unidad_alquilada: string;

    @Column({ type: 'varchar', length: 25, nullable: true })
    mail_unidad_alquilada: string;

    //Agustin
    @Column({ type: 'date', nullable: true })
    fecha_alta_ruta: Date;

    @Column({ type: 'varchar', length: 25, nullable: true })
    nro_ruta: string;

    @Column({ type: 'boolean', default: false })
    microtrack: boolean;

    @Column({ type: 'boolean', default: false })
    yer_estado: boolean;

    @Column({ type: 'boolean', default: false })
    yer_tarjeta: boolean;

    //Campo
    @Column({ type: 'enum', enum: Operators, nullable: true })
    operadora: Operators;

    @Column({ type: 'enum', enum: Zones, nullable: true })
    area: Zones;

    @Column({ type: 'enum', enum: Contracts, nullable: true })
    contrato: Contracts;

    @Column({ type: 'enum', enum: VehicularFunctions, nullable: true })
    funcion: VehicularFunctions;

    @Column({ type: 'varchar', length: 30, nullable: true })
    nro_hab_vtv: string;

    @Column({ type: 'date', nullable: true })
    fecha_inicio_vtv: Date;

    @Column({ type: 'date', nullable: true })
    vto_vtv: Date;
}
