import { HttpStatus, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '../primsa.service.js';

import { CreateProductDto, UpdateProductDto } from './dto/index.js';
import { PaginationDto } from '../common/dto/index.js';

@Injectable()
export class ProductsService {

  constructor(private readonly prisma: PrismaService) { }

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
    })
    return product;
  }

  async findAll({ page = 1, limit = 10 }: PaginationDto) {

    const totalPages = await this.prisma.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);

    return {
      meta: {
        total: totalPages,
        page: page,
        lastPage
      },
      data: await this.prisma.product.findMany({
        where: { available: true },
        take: limit,
        skip: (page - 1) * limit,
      })
    }
  }

  async findOne(id: number) {

    const product = await this.prisma.product.findUnique({
      where: { id, available: true }
    });

    if (!product) {
      throw new RpcException({
        message: `Product with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    return product;
  }

  async update(id: number, { id: __, ...updateProductDto }: UpdateProductDto) {
    await this.findOne(id);

    return await this.prisma.product.update({
      where: { id },
      data: updateProductDto
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        available: false
      }
    })

    return product;
  }

  async validateProduct(ids: number[]) {
    const newIds = Array.from(new Set(ids));

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: newIds
        }
      }
    });

    if (products.length !== ids.length) {
      throw new RpcException({
        message: 'Some products were not found',
        status: HttpStatus.BAD_REQUEST
      });
    }

    return products;
  }
}
